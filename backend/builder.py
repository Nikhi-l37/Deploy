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
                            if not c.name.startswith("deploy-"):
                                continue  # Never kill non-deploy containers (Redis, Postgres, etc.)
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
# HEAVY PACKAGE DETECTION — Block ML/AI packages that crash small servers
# =============================================================================

# Packages that require too much RAM/disk for free tier (t3.large = 8GB RAM)
BLOCKED_PACKAGES = {
    # Python heavy packages
    "torch": "PyTorch (~555MB download, 1-2GB RAM)",
    "tensorflow": "TensorFlow (~500MB download, 1-2GB RAM)",
    "tensorflow-gpu": "TensorFlow GPU (~500MB download, needs GPU)",
    "keras": "Keras (requires TensorFlow backend)",
    "paddlepaddle": "PaddlePaddle (~400MB download, 1-2GB RAM)",
    "jax": "JAX (~300MB download, high RAM usage)",
    "jaxlib": "JAX Library (~300MB download)",
    "mxnet": "Apache MXNet (~500MB download)",
    "caffe": "Caffe (requires GPU, 1-2GB RAM)",
    "detectron2": "Detectron2 (requires PyTorch + GPU)",
    "mmdet": "MMDetection (requires PyTorch, 2GB+ RAM)",
    "ultralytics": "YOLOv8/Ultralytics (requires PyTorch, 1GB+ RAM)",
    "easyocr": "EasyOCR (requires PyTorch, 1-2GB RAM)",
    "paddleocr": "PaddleOCR (requires PaddlePaddle, 1GB+ RAM)",
    "transformers": "HuggingFace Transformers (requires PyTorch/TF, 1GB+ RAM)",
    "diffusers": "HuggingFace Diffusers (requires PyTorch, 4GB+ RAM)",
    "langchain": "LangChain (can require heavy ML backends)",
    "spacy": "spaCy (NLP models can be 500MB+)",
    "allennlp": "AllenNLP (requires PyTorch, 1GB+ RAM)",
    "fairseq": "Fairseq (requires PyTorch, 1GB+ RAM)",
    "sentence-transformers": "Sentence Transformers (requires PyTorch, 1GB+ RAM)",
    "xgboost": "XGBoost (~200MB, high memory usage)",
    "lightgbm": "LightGBM (~200MB, high memory usage)",
    "catboost": "CatBoost (~300MB, high memory usage)",
    # Node.js heavy packages
    "puppeteer": "Puppeteer (downloads Chromium ~300MB)",
    "playwright": "Playwright (downloads browsers ~500MB)",
}

def _check_heavy_packages(project_id: str, build_path: str):
    """Scans dependency files for packages that are too heavy for the free tier.
    Fails the build early with a clear message instead of wasting 10 minutes building."""
    
    found_heavy = []
    
    # Check Python requirements.txt
    req_path = os.path.join(build_path, "requirements.txt")
    if os.path.exists(req_path):
        try:
            with open(req_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip().lower()
                    if not line or line.startswith("#") or line.startswith("-"):
                        continue
                    # Extract package name (before ==, >=, <=, ~=, [, etc.)
                    pkg_name = line.split("==")[0].split(">=")[0].split("<=")[0].split("~=")[0].split("[")[0].split("<")[0].split(">")[0].strip()
                    # Normalize underscores/hyphens
                    pkg_normalized = pkg_name.replace("-", "_").replace(".", "_")
                    for blocked, reason in BLOCKED_PACKAGES.items():
                        if pkg_normalized == blocked.replace("-", "_"):
                            found_heavy.append(f"  - {pkg_name}: {reason}")
                            break
        except Exception:
            pass
    
    # Check Node.js package.json
    pkg_json_path = os.path.join(build_path, "package.json")
    if os.path.exists(pkg_json_path):
        try:
            import json
            with open(pkg_json_path, "r", encoding="utf-8") as f:
                pkg_data = json.load(f)
            all_deps = {}
            all_deps.update(pkg_data.get("dependencies", {}))
            all_deps.update(pkg_data.get("devDependencies", {}))
            for dep_name in all_deps:
                dep_normalized = dep_name.lower().replace("-", "_")
                for blocked, reason in BLOCKED_PACKAGES.items():
                    if dep_normalized == blocked.replace("-", "_"):
                        found_heavy.append(f"  - {dep_name}: {reason}")
                        break
        except Exception:
            pass
    
    if found_heavy:
        heavy_list = "\n".join(found_heavy)
        push_log(project_id, f"BLOCKED: Heavy packages detected that exceed free tier limits:")
        push_log(project_id, heavy_list)
        push_log(project_id, "Free tier supports: Node.js (Express, Fastify), Python (Flask, FastAPI), Go, and static sites.")
        push_log(project_id, "ML/AI projects require dedicated GPU servers. Consider using Google Colab, AWS SageMaker, or a paid tier.")
        raise Exception(
            f"Deploy blocked: Your project uses packages that require more resources than the free tier provides:\n{heavy_list}\n"
            "Remove these packages or upgrade to a higher tier."
        )


# =============================================================================
# ENTRYPOINT.SH — Frontend Nginx with smart API proxy (for fullstack)
# GET requests → SPA (index.html)
# POST/PUT/DELETE/PATCH → proxy to backend (API calls)
# =============================================================================

FRONTEND_ENTRYPOINT = """#!/bin/sh
cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 8080;
    root /usr/share/nginx/html;

    # Hashed assets — cache forever
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA catch-all — never cache index.html (ports get reused by different projects)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }
}
NGINX
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
        project_type = project.get("project_type")
        lang = detect_language(build_path, project_type=project_type, root_dir=root_dir)
        push_log(project_id, f"Detected: {lang}")
        
        # 3.5 Check for heavy/unsupported packages that would crash the server
        _check_heavy_packages(project_id, build_path)
        
        env_vars = decrypt_env_vars(project_id)
        build_args = {}
        
        if lang != "dockerfile":
            generate_dockerfile(project_id, build_path, lang, env_vars, build_args, push_log, project_type=project_type)
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
        # Use cached layers from previous builds for faster redeploys
        try:
            docker_client.images.get(image_name)
            cmd.extend(["--cache-from", image_name])
            push_log(project_id, "Using cached layers from previous build for speed ⚡")
        except docker.errors.ImageNotFound:
            pass
        # Bust Docker cache when frontend env vars change (VITE_/REACT_APP_/NEXT_PUBLIC_)
        # These are baked into JS at build time — cached builds would use stale values
        if build_args:
            cmd.append("--no-cache")
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
        
        # Background timer: kill the build if it exceeds 10 minutes
        # This handles the case where stdout blocks forever (e.g., npm install hangs on network drop)
        build_timeout = 1200  # 20 minutes (allows for slow internet)
        build_killed = [False]
        build_done = threading.Event()
        def _kill_on_timeout():
            # Wait for build_done signal OR timeout (whichever comes first)
            if not build_done.wait(timeout=build_timeout):
                # Timeout expired and build is still running
                if process.poll() is None:
                    build_killed[0] = True
                    process.kill()
        
        timer = threading.Thread(target=_kill_on_timeout, daemon=True)
        timer.start()
        
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
                
        return_code = process.wait()
        build_done.set()  # Cancel the timeout timer thread immediately
        if build_killed[0]:
            raise Exception("Docker build timed out after 20 minutes. Check your internet connection or reduce dependencies.")
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
        
        # Release the port so it can be reused by future deploys
        try:
            supabase.table("port_registry").update({
                "in_use": False, "project_id": None
            }).eq("project_id", project_id).execute()
            push_log(project_id, "🔓 Released port allocation.")
        except Exception:
            pass
        
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
