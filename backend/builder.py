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
from cryptography.fernet import Fernet
import config
from database import supabase

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
    
    # 1. Publish to live websocket listeners
    redis_client.publish(channel, log_msg)
    
    # 2. Append to permanent logs in DB
    supabase.table("deploy_logs").insert({
        "project_id": project_id,
        "log_text": log_msg
    }).execute()
    print(log_msg)

def update_status(project_id: str, status: str, extra_data: dict = None):
    """Updates the project status in Supabase."""
    payload = {"status": status}
    if extra_data:
        payload.update(extra_data)
    supabase.table("projects").update(payload).eq("id", project_id).execute()
    push_log(project_id, f"==> Status updated to {status}")

def get_free_port(project_id: str) -> int:
    """Finds a free port and assigns it to the project."""
    res = supabase.table("port_registry").select("port").eq("in_use", False).limit(1).execute()
    if not res.data:
        raise Exception("No free ports available on the platform.")
    
    port = res.data[0]["port"]
    # Mark as in use
    supabase.table("port_registry").update({"in_use": True, "project_id": project_id}).eq("port", port).execute()
    return port

def decrypt_env_vars(project_id: str) -> dict:
    """Fetches and decrypts environment variables for the project."""
    res = supabase.table("env_vars").select("*").eq("project_id", project_id).execute()
    env_dict = {}
    for ev in res.data:
        decrypted = fernet.decrypt(ev["value_enc"].encode()).decode()
        env_dict[ev["key_name"]] = decrypted
    return env_dict

def detect_language(repo_path: str) -> str:
    """Detects the language of the cloned repo."""
    if os.path.exists(os.path.join(repo_path, "Dockerfile")):
        return "dockerfile"
    elif os.path.exists(os.path.join(repo_path, "requirements.txt")):
        return "python"
    elif os.path.exists(os.path.join(repo_path, "package.json")):
        return "node"
    else:
        raise Exception("Unsupported project: Missing Dockerfile, requirements.txt, or package.json")

def generate_dockerfile(project_id: str, repo_path: str, language: str):
    """Generates a Dockerfile if the project doesn't have one."""
    df_path = os.path.join(repo_path, "Dockerfile")
    
    if language == "python":
        content = """
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Try to find a main.py or app.py
CMD ["sh", "-c", "if [ -f main.py ]; then python main.py; elif [ -f app.py ]; then python app.py; else echo 'No main.py or app.py found' && exit 1; fi"]
"""
    elif language == "node":
        content = """
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
"""
    with open(df_path, "w") as f:
        f.write(content.strip())
    push_log(project_id, f"Auto-generated {language} Dockerfile")

def force_remove_readonly(func, path, excinfo):
    """Helper to unlock read-only files on Windows so shutil.rmtree can delete .git folders."""
    import stat
    os.chmod(path, stat.S_IWRITE)
    func(path)

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
        # 2. Clone the repository
        # (For private repos, we would inject the user's github_access_token into the URL here)
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
            
        push_log(project_id, "Cloning repository...")
        os.system(f"git clone {github_url} {repo_path}")
        
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
        
        if lang != "dockerfile":
            generate_dockerfile(project_id, build_path, lang)

        # 4. Build Docker Image
        push_log(project_id, "Building Docker image. This may take a minute...")
        image_name = f"{safe_name}:latest"
        
        # We use the low-level API to stream logs
        build_logs = docker_client.api.build(path=build_path, tag=image_name, decode=True)
        for chunk in build_logs:
            if 'stream' in chunk:
                line = chunk['stream'].strip()
                if line:
                    push_log(project_id, f"[BUILD] {line}")
            elif 'error' in chunk:
                raise Exception(f"Docker Build Error: {chunk['error']}")

        # 5. Clean up old container if it exists
        if project.get("container_id"):
            try:
                old_container = docker_client.containers.get(project["container_id"])
                push_log(project_id, "Stopping old version...")
                old_container.stop(timeout=2)
                old_container.remove(force=True)
            except Exception:
                pass # Container might already be gone

        # 6. Prepare Runtime (Ports & Env Vars)
        port = project.get("port") or get_free_port(project_id)
        env_vars = decrypt_env_vars(project_id)
        
        # Default PORT env var for the app inside the container
        if "PORT" not in env_vars:
            env_vars["PORT"] = "8080" # Most node/python apps expect this if not set
            
        # 7. Run the new container
        push_log(project_id, f"Starting container on port {port}...")
        
        run_kwargs = {
            "image": image_name,
            "detach": True,
            "ports": {f"{env_vars['PORT']}/tcp": port},
            "environment": env_vars,
            "mem_limit": config.CONTAINER_MEM_LIMIT,
            "cpu_period": config.CONTAINER_CPU_PERIOD,
            "cpu_quota": config.CONTAINER_CPU_QUOTA,
            "name": safe_name,
            "restart_policy": {"Name": "unless-stopped"}
        }
        
        # Override start command if provided
        start_cmd = project.get("start_command")
        if start_cmd and start_cmd.strip():
            run_kwargs["command"] = start_cmd.strip()
            
        container = docker_client.containers.run(**run_kwargs)

        # 8. Health Check
        push_log(project_id, "Waiting 5 seconds for health check...")
        time.sleep(5)
        container.reload()
        
        if container.status != "running":
            logs = container.logs().decode('utf-8')
            push_log(project_id, f"CRASH LOGS:\n{logs}")
            raise Exception("Container crashed immediately after starting.")

        # 9. Success!
        update_status(project_id, "RUNNING", {
            "container_id": container.id,
            "port": port
        })
        push_log(project_id, "✅ Deploy successful! App is now live.")
        
        # 10. Update Nginx Load Balancer
        import nginx_config
        nginx_config.generate_nginx_config()

    except Exception as e:
        update_status(project_id, "FAILED")
        push_log(project_id, f"Deploy failed: {str(e)}")
        
    finally:
        # Always clean up the cloned code
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
            push_log(project_id, "Cleaned up temporary build files.")


def start_worker():
    """Infinite loop that pulls jobs from Redis and builds them sequentially."""
    print("Builder Worker Started! Waiting for jobs in the queue...")
    while True:
        try:
            # Use a non-blocking pop with a short sleep to avoid Windows socket timeout issues
            project_id = redis_client.lpop("build_queue")
            if not project_id:
                time.sleep(2)
                continue
            print(f"Picked up job for project: {project_id}")
            run_pipeline(project_id)
        except Exception as e:
            print(f"Worker Error: {str(e)}")
            time.sleep(5) # Prevent tight crash loops

if __name__ == "__main__":
    start_worker()
