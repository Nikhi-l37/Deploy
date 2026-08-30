"""
Deploy — Builder Worker
Pulls projects from the Redis queue one at a time and runs the full deploy pipeline:
clone -> detect language -> decrypt secrets -> build docker -> run docker -> check health
"""
import time
import os
import shutil
import redis
import docker
import requests
import subprocess
from cryptography.fernet import Fernet
import threading
import config
from database import supabase
from detectors import detect_language, detect_framework
from dockerfile_gen import generate_dockerfile

shutdown_event = threading.Event()

# Initialize services
redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
docker_client = docker.from_env()
fernet = Fernet(config.FERNET_KEY)

def push_log(project_id: str, message: str):
    """Sends log messages to Redis pub/sub (for live UI) and saves to DB."""
    # Sanitize message for Windows console compatibility
    safe_message = message.encode('ascii', 'replace').decode('ascii')
    
    channel = f"logs:{project_id}"
    log_msg = f"[{time.strftime('%H:%M:%S')}] {safe_message}"
    print(log_msg)
    
    # 1. Publish to live websocket listeners with retry on Windows socket block
    try:
        redis_client.publish(channel, log_msg)
    except Exception:
        try:
            time.sleep(0.02)
            redis_client.publish(channel, log_msg)
        except Exception:
            pass
    
    # 2. Append to permanent logs in DB with retry
    try:
        supabase.table("deploy_logs").insert({
            "project_id": project_id,
            "log_text": log_msg
        }).execute()
    except Exception:
        try:
            time.sleep(0.02)
            supabase.table("deploy_logs").insert({
                "project_id": project_id,
                "log_text": log_msg
            }).execute()
        except Exception:
            pass

def update_status(project_id: str, status: str, extra_data: dict = None):
    """Updates the project status in Supabase."""
    payload = {"status": status}
    if extra_data:
        payload.update(extra_data)
    supabase.table("projects").update(payload).eq("id", project_id).execute()
    push_log(project_id, f"==> Status updated to {status}")

def get_free_port(project_id: str) -> int:
    """Finds a free port and assigns it to the project, using a Redis lock to prevent race conditions."""
    import socket
    lock = redis_client.lock("lock:port_allocation", timeout=10)
    if not lock.acquire(blocking=True, blocking_timeout=5):
        raise Exception("Could not acquire port allocation lock. Try again.")
    try:
        res = supabase.table("port_registry").select("port").eq("in_use", False).order("port").execute()
        if not res.data:
            raise Exception("No free ports available on the platform.")
        
        for row in res.data:
            port = row["port"]
            # Verify the port is ACTUALLY free on the host (no zombie container)
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('127.0.0.1', port))
                sock.close()
                if result == 0:
                    # Port is occupied by something — try to kill the zombie container
                    try:
                        for c in docker_client.containers.list(all=True):
                            port_bindings = c.attrs.get("HostConfig", {}).get("PortBindings", {}) or {}
                            for bindings in port_bindings.values():
                                if bindings and any(b.get("HostPort") == str(port) for b in bindings):
                                    print(f"[Port] Removing zombie container {c.name} on port {port}")
                                    c.stop(timeout=1)
                                    c.remove(force=True)
                    except Exception:
                        pass
                    # Re-check if we freed it
                    sock2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock2.settimeout(1)
                    result2 = sock2.connect_ex(('127.0.0.1', port))
                    sock2.close()
                    if result2 == 0:
                        continue  # Still occupied, skip this port
            except Exception:
                pass
            
            # Port is free — assign it
            supabase.table("port_registry").update({"in_use": True, "project_id": project_id}).eq("port", port).execute()
            return port
        
        raise Exception("All ports are occupied. Try deleting unused projects.")
    finally:
        lock.release()

def decrypt_env_vars(project_id: str) -> dict:
    """Fetches and decrypts environment variables for the project."""
    res = supabase.table("env_vars").select("*").eq("project_id", project_id).execute()
    env_dict = {}
    for ev in res.data:
        decrypted = fernet.decrypt(ev["value_enc"].encode()).decode()
        env_dict[ev["key_name"]] = decrypted
    return env_dict

def force_remove_readonly(func, path, excinfo):
    """Helper to unlock read-only files on Windows so shutil.rmtree can delete .git folders."""
    import stat
    os.chmod(path, stat.S_IWRITE)
    func(path)


# =============================================================================
# ENTRYPOINT.SH — Frontend Nginx with smart API proxy (for fullstack)
# GET requests → SPA (index.html)
# POST/PUT/DELETE/PATCH → proxy to backend (API calls)
# =============================================================================

FRONTEND_ENTRYPOINT = """#!/bin/sh
if [ -n "$BACKEND_PROXY_URL" ]; then
  echo "Smart API proxy enabled -> $BACKEND_PROXY_URL"
  cat > /etc/nginx/conf.d/default.conf << 'CONFEOF'
server {
  listen 8080;
  root /usr/share/nginx/html;

  # Static assets - cache aggressively
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Serve static files if they exist, otherwise go to @app
  location / {
    try_files $uri $uri/ @app;
  }

  # Smart routing: GET -> SPA, non-GET -> backend API
  location @app {
    # Non-GET requests (POST, PUT, DELETE, PATCH) are API calls -> proxy to backend
    error_page 418 = @backend;
    if ($request_method != GET) {
        return 418;
    }
    # GET request to unknown path -> SPA route -> serve index.html
    rewrite ^ /index.html last;
  }

  location @backend {
    # Resolve at request time (not startup) using Docker's internal DNS
    resolver 127.0.0.11 valid=10s ipv6=off;
    set $backend_url BACKEND_PROXY_PLACEHOLDER;
    proxy_pass $backend_url;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
  }
}
CONFEOF
  sed -i "s|BACKEND_PROXY_PLACEHOLDER|$BACKEND_PROXY_URL|g" /etc/nginx/conf.d/default.conf
else
  echo 'server { listen 8080; root /usr/share/nginx/html; location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; } location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
fi
exec nginx -g "daemon off;"
"""


# =============================================================================
# DEPLOY PIPELINE — The main build & run orchestrator
# =============================================================================

def run_pipeline(project_id: str):
    """Runs the full deployment pipeline for a single project."""
    import tempfile
    
    # 1. Fetch project info
    res = supabase.table("projects").select("*, users(github_id)").eq("id", project_id).execute()
    if not res.data:
        return
    project = res.data[0]
    github_url = project["github_url"]
    
    # Generate a clean project name for docker
    safe_name = f"deploy-{project_id[:8]}"
    
    # Use cross-platform temp directory
    deploy_dir = os.path.join(tempfile.gettempdir(), "deployly")
    os.makedirs(deploy_dir, exist_ok=True)
    repo_path = os.path.join(deploy_dir, safe_name)
    
    # Clear old build logs before starting a fresh build
    supabase.table("deploy_logs").delete().eq("project_id", project_id).execute()
    
    update_status(project_id, "BUILDING")
    push_log(project_id, f"Starting build for {github_url}")

    try:
        # 2. Clone the repository (shallow clone for speed)
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
            
        push_log(project_id, "Cloning repository...")
        branch = project.get("branch") or "main"
        result = subprocess.run(["git", "clone", "--depth", "1", "-b", branch, github_url, repo_path], capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            # Retry without -b flag in case the branch doesn't exist (use default branch)
            result = subprocess.run(["git", "clone", "--depth", "1", github_url, repo_path], capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            raise Exception(f"Git clone failed: {result.stderr}")
        
        if not os.path.exists(repo_path):
            raise Exception("Failed to clone repository. Is it private or invalid?")

        # 2.5 Resolve root directory
        root_dir = project.get("root_directory") or "/"
        build_path = os.path.abspath(os.path.join(repo_path, root_dir.lstrip("/\\")))
        if not build_path.startswith(os.path.abspath(repo_path)):
            raise Exception("Invalid root directory (escapes repo)")

        # 3. Detect language
        push_log(project_id, f"Detecting language in {root_dir}...")
        lang = detect_language(build_path)
        push_log(project_id, f"Detected: {lang}")
        
        env_vars = decrypt_env_vars(project_id)
        build_args = {}
        
        # Auto-inject API URL for fullstack frontend projects
        # Scans source code to find the actual VITE env var name (VITE_API_URL, VITE_API_BASE_URL, etc.)
        if project.get("project_type") == "frontend":
            _auto_link_backend(project_id, project, env_vars, build_path)
        
        if lang != "dockerfile":
            generate_dockerfile(project_id, build_path, lang, env_vars, build_args, push_log)
        else:
            # Project has its own Dockerfile — still pass VITE_/REACT_APP_/NEXT_PUBLIC_ as build args
            # These are needed for frameworks that bake env vars at build time (Vite, CRA, Next.js)
            for k, v in env_vars.items():
                if k.startswith(('VITE_', 'REACT_APP_', 'NEXT_PUBLIC_')):
                    build_args[k] = v
            if build_args:
                push_log(project_id, f"Injected build-time env vars: {list(build_args.keys())}")

        # Auto-generate .dockerignore to speed up builds and reduce image size
        dockerignore_path = os.path.join(build_path, ".dockerignore")
        if not os.path.exists(dockerignore_path):
            with open(dockerignore_path, "w") as f:
                f.write("node_modules\n.git\n.env\n*.log\ndist\nbuild\n.next\n__pycache__\n*.pyc\n.venv\nvenv\n")

        # Write entrypoint.sh for frontend apps (enables runtime API proxying via VITE_API_URL)
        entrypoint_path = os.path.join(build_path, ".deployly-entrypoint.sh")
        if lang == "node" and detect_framework(build_path) and not os.path.exists(entrypoint_path):
            with open(entrypoint_path, "w", newline="\n") as f:
                f.write(FRONTEND_ENTRYPOINT)
            push_log(project_id, "Created entrypoint.sh for frontend API proxying")

        # Log build args for debugging VITE_ injection
        if build_args:
            push_log(project_id, f"Build args detected: {list(build_args.keys())}")

        # 4. Build Docker Image
        push_log(project_id, "Building Docker image. This may take a minute...")
        image_name = f"{safe_name}:latest"
        
        cmd = ["docker", "build", "--progress=plain", "-t", image_name, build_path]
        for k, v in build_args.items():
            cmd.extend(["--build-arg", f"{k}={v}"])
            
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            bufsize=1
        )
        last_log_time = 0
        try:
            for line in process.stdout:
                clean_line = line.strip()
                if clean_line:
                    # Throttle: ensure at least 50ms between log lines to prevent socket exhaustion on Windows
                    now = time.time()
                    if now - last_log_time < 0.05:
                        time.sleep(0.05)
                    push_log(project_id, f"[BUILD] {clean_line}")
                    last_log_time = time.time()
        finally:
            if process.stdout:
                process.stdout.close()
                
        try:
            return_code = process.wait(timeout=600)  # 10 minute build timeout
        except subprocess.TimeoutExpired:
            process.kill()
            raise Exception("Docker build timed out after 10 minutes. Check for infinite loops in build scripts.")
        if return_code != 0:
            raise Exception(f"Docker build failed with exit code {return_code}")
        
        # Brief cooldown to let Windows sockets recover after rapid build log streaming
        time.sleep(2)

        # 5. Clean up old container by NAME (not container_id, which may be stale)
        try:
            old_container = docker_client.containers.get(safe_name)
            push_log(project_id, "Stopping old version...")
            old_container.stop(timeout=2)
            old_container.remove(force=True)
        except docker.errors.NotFound:
            pass
        except Exception:
            pass

        # 6. Prepare Runtime (Ports & Env Vars)
        port = project.get("port")
        if port:
            port_check = supabase.table("port_registry").select("project_id").eq("port", port).execute()
            if not port_check.data or port_check.data[0].get("project_id") != project_id:
                port = get_free_port(project_id)
        else:
            port = get_free_port(project_id)
        
        # Default PORT env var for the app inside the container
        user_set_port = "PORT" in env_vars
        if not user_set_port:
            env_vars["PORT"] = "8080"
        
        # Auto-detect container port from Dockerfile EXPOSE statement
        # User-provided PORT env var takes priority over EXPOSE
        container_port = env_vars["PORT"]
        dockerfile_path = os.path.join(build_path, "Dockerfile")
        if os.path.exists(dockerfile_path):
            try:
                with open(dockerfile_path) as df:
                    for line in df:
                        line = line.strip()
                        if line.upper().startswith("EXPOSE"):
                            exposed = line.split()[1] if len(line.split()) > 1 else None
                            if exposed and exposed.isdigit():
                                if not user_set_port:
                                    container_port = exposed
                                    env_vars["PORT"] = exposed  # Sync so app listens on the same port Docker maps to
                                    push_log(project_id, f"Detected EXPOSE {container_port} from Dockerfile")
                                else:
                                    push_log(project_id, f"Dockerfile EXPOSE {exposed} ignored (user PORT={container_port} takes priority)")
                                break
            except Exception:
                pass

        # 7. Run the new container
        push_log(project_id, f"Starting container on port {port}...")
        
        # Ensure the shared Docker network exists (for container-to-container communication on AWS)
        try:
            docker_client.networks.get(config.DOCKER_NETWORK)
        except docker.errors.NotFound:
            docker_client.networks.create(config.DOCKER_NETWORK, driver="bridge")
            push_log(project_id, f"Created Docker network: {config.DOCKER_NETWORK}")
        
        run_kwargs = {
            "image": image_name,
            "detach": True,
            "ports": {f"{container_port}/tcp": port},
            "environment": env_vars,
            "mem_limit": config.CONTAINER_MEM_LIMIT_FRONTEND if project.get("project_type") == "frontend" else config.CONTAINER_MEM_LIMIT_BACKEND,
            "cpu_period": config.CONTAINER_CPU_PERIOD,
            "cpu_quota": config.CONTAINER_CPU_QUOTA,
            "name": safe_name,
            "network": config.DOCKER_NETWORK,
            "restart_policy": {"Name": "unless-stopped"}
        }
        
        # Override start command if provided (only for backend — frontend uses Dockerfile CMD)
        start_cmd = project.get("start_command")
        if start_cmd and start_cmd.strip() and project.get("project_type") != "frontend":
            run_kwargs["command"] = ["sh", "-c", start_cmd.strip()]
            
        container = docker_client.containers.run(**run_kwargs)

        # 8. Health Check — wait for container to be running AND responsive
        push_log(project_id, "Running health check...")
        healthy = False
        for attempt in range(15):
            time.sleep(1)
            container.reload()
            if container.status != "running":
                logs = container.logs(tail=30).decode('utf-8', errors='replace')
                push_log(project_id, f"CRASH LOGS:\n{logs}")
                raise Exception("Container crashed immediately after starting.")
            try:
                resp = requests.get(f"http://127.0.0.1:{port}/", timeout=2)
                if resp.status_code < 500:
                    healthy = True
                    push_log(project_id, f"Health check passed (HTTP {resp.status_code})")
                    break
            except Exception:
                pass
        if not healthy:
            push_log(project_id, "Warning: App is running but not responding to HTTP yet. It may need more startup time.")

        # 9. Success!
        update_status(project_id, "RUNNING", {
            "container_id": container.id,
            "port": port
        })
        redis_client.set(f"last_active:{project_id}", time.time())

        push_log(project_id, "🚀 Deploy successful! App is now live.")
        
        # 10. Update Nginx Load Balancer
        import nginx_config
        nginx_config.generate_nginx_config()


    except Exception as e:
        update_status(project_id, "FAILED")
        push_log(project_id, f"Deploy failed: {str(e)}")
        
        # Auto-cleanup failed containers and images
        container_name = f"deploy-{project_id[:8]}"
        try:
            container = docker_client.containers.get(container_name)
            container.remove(force=True)
            push_log(project_id, "🧹 Cleaned up failed container.")
        except Exception:
            pass
        
        try:
            docker_client.images.remove(f"deploy-{project_id[:8]}", force=True)
            push_log(project_id, "🧹 Cleaned up failed image.")
        except Exception:
            pass
        
    finally:
        # Always clean up the cloned code
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
            push_log(project_id, "Cleaned up temporary build files.")


def _auto_link_backend(project_id, project, env_vars, build_path):
    """Auto-inject the correct VITE_*API* env var for fullstack frontend projects.
    Sets browser-accessible URL for VITE vars and Docker network URL for Nginx proxy."""
    import re
    import glob
    try:
        user_id = project.get("user_id")
        github_url_normalized = project.get("github_url", "")
        siblings = supabase.table("projects").select("*").eq(
            "user_id", user_id
        ).eq("github_url", github_url_normalized).neq(
            "id", project_id
        ).execute()
        
        backend_project = None
        # Prefer RUNNING backends, then most recently created
        running_backends = [s for s in siblings.data if s.get("project_type") == "backend" and s.get("status") in ("RUNNING", "BUILDING", "SLEEPING")]
        all_backends = [s for s in siblings.data if s.get("project_type") == "backend"]
        
        candidates = running_backends if running_backends else all_backends
        if candidates:
            # Pick the most recently created one
            candidates.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            backend_project = candidates[0]
        
        if not backend_project:
            return
        
        # Detect the actual internal port the backend listens on
        backend_container_name = f"deploy-{backend_project['id'][:8]}"
        backend_host_port = backend_project.get("port")  # Host port (e.g., 8001)
        backend_env = decrypt_env_vars(backend_project["id"])
        internal_port = backend_env.get("PORT", "8080")
        
        # Also check the actual Docker container port mapping
        try:
            bc = docker_client.containers.get(backend_container_name)
            exposed_ports = bc.attrs.get("Config", {}).get("ExposedPorts", {})
            if exposed_ports:
                # Use the first exposed port (e.g., "80/tcp" -> 80)
                first_port = list(exposed_ports.keys())[0].split("/")[0]
                internal_port = first_port
        except Exception:
            pass
        
        # Browser-accessible URL (for VITE vars baked into JS)
        browser_url = f"{config.HOST_URL}:{backend_host_port}" if backend_host_port else f"http://{backend_container_name}:{internal_port}"
        
        # Docker network URL (for Nginx proxy inside the container)
        docker_url = f"http://{backend_container_name}:{internal_port}"
        
        # Scan source code to find the actual VITE env var name
        # Look for patterns like: import.meta.env.VITE_API_BASE_URL, process.env.VITE_API_URL, etc.
        detected_var_names = set()
        api_var_pattern = re.compile(r'import\.meta\.env\.(VITE_[A-Z_]*(?:API|BACKEND|SERVER|BASE)[A-Z_]*URL[A-Z_]*)')
        
        search_extensions = ["*.js", "*.jsx", "*.ts", "*.tsx", "*.vue", "*.svelte"]
        for ext in search_extensions:
            for filepath in glob.glob(os.path.join(build_path, "src", "**", ext), recursive=True):
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    matches = api_var_pattern.findall(content)
                    detected_var_names.update(matches)
                except Exception:
                    pass
        
        # Also check root-level files (api.js, config.js, etc.)
        for ext in search_extensions:
            for filepath in glob.glob(os.path.join(build_path, ext)):
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    matches = api_var_pattern.findall(content)
                    detected_var_names.update(matches)
                except Exception:
                    pass
        
        # Use detected names, or fall back to VITE_API_URL
        if not detected_var_names:
            detected_var_names = {"VITE_API_URL"}
        
        # Filter out any that the user already set manually
        var_names_to_set = [name for name in detected_var_names if name not in env_vars]
        
        if not var_names_to_set:
            push_log(project_id, f"API URL already set by user: {list(detected_var_names)}")
            return
        
        # Clean up old auto-linked env vars from previous deploys
        for var_name in var_names_to_set:
            try:
                supabase.table("env_vars").delete().eq("project_id", project_id).eq("key_name", var_name).execute()
            except Exception:
                pass
        
        # Set VITE vars to browser-accessible URL
        for var_name in var_names_to_set:
            env_vars[var_name] = browser_url
            # Save to DB so user can see it in the dashboard
            try:
                f_enc = fernet.encrypt(browser_url.encode()).decode()
                supabase.table("env_vars").insert({
                    "project_id": project_id,
                    "key_name": var_name,
                    "value_enc": f_enc
                }).execute()
            except Exception:
                pass
        
        # Also set BACKEND_PROXY_URL for our Nginx smart proxy (Docker network)
        env_vars["BACKEND_PROXY_URL"] = docker_url
        
        push_log(project_id, f"Auto-linked to backend: {browser_url} (proxy: {docker_url})")
        push_log(project_id, f"Set env vars: {var_names_to_set}")
        
    except Exception as link_err:
        push_log(project_id, f"Warning: Could not auto-link backend: {link_err}")


# =============================================================================
# WORKER — Pulls jobs from Redis queue and processes them sequentially
# =============================================================================

def start_worker():
    """Infinite loop that pulls jobs from Redis and builds them sequentially."""
    print("Builder Worker Started! Waiting for jobs in the queue...")
    while not shutdown_event.is_set():
        try:
            project_id = redis_client.lpop("build_queue")
            if not project_id:
                shutdown_event.wait(timeout=2)
                continue
            print(f"Picked up job for project: {project_id}")
            run_pipeline(project_id)
        except Exception as e:
            print(f"Worker Error: {str(e)}")
            shutdown_event.wait(timeout=5)
    print("Builder Worker shutting down gracefully.")

if __name__ == "__main__":
    start_worker()
