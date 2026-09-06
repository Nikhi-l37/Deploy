"""
Deploy — Auto-Sleep Watchdog Daemon
Monitors idle containers and safely puts them to sleep to conserve system resources.
"""
import asyncio
import time
import docker
import redis
import config
from database import supabase

redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
docker_client = docker.from_env()

async def watchdog_task():
    """Background task to pause idle containers.
    
    Monitors Redis last_active timestamps set by the /service/ proxy.
    When a container has had no user traffic for WATCHDOG_IDLE_TIMEOUT,
    it is safely stopped and marked as SLEEPING in Supabase.
    """
    print(f"[Watchdog] Daemon started (Timeout: {config.WATCHDOG_IDLE_TIMEOUT}s, Interval: {config.WATCHDOG_POLL_INTERVAL}s)")
    
    while True:
        try:
            await asyncio.to_thread(_watchdog_poll)
        except Exception as e:
            print(f"[Watchdog] Exception in poll loop: {e}")
            
        await asyncio.sleep(config.WATCHDOG_POLL_INTERVAL)

def _has_inbound_connections(container_name):
    """Check if a container has INBOUND TCP connections from users.
    
    Only counts connections TO the app's LISTEN port (user HTTP requests).
    Ignores OUTBOUND connections FROM the app (database heartbeats to MongoDB/PostgreSQL).
    
    netstat example:
      tcp  0.0.0.0:3001  0.0.0.0:*          LISTEN      ← app listening
      tcp  172.18.0.3:3001  172.18.0.1:50678  ESTABLISHED ← INBOUND (user request) ✅
      tcp  172.18.0.3:45678  54.83.23.8:27017  ESTABLISHED ← OUTBOUND (MongoDB) ❌
    """
    try:
        result = docker_client.containers.get(container_name).exec_run(
            "sh -c 'netstat -tn 2>/dev/null || ss -tn 2>/dev/null'",
            demux=True
        )
        stdout = result.output[0]
        if not stdout:
            return False
        output = stdout.decode("utf-8", errors="ignore")
        lines = output.splitlines()
        
        # Step 1: Find which ports the app is LISTENing on
        listen_ports = set()
        for line in lines:
            if "LISTEN" in line:
                parts = line.split()
                for part in parts:
                    if ":" in part:
                        port = part.rsplit(":", 1)[-1]
                        if port.isdigit():
                            listen_ports.add(port)
                        break
        
        if not listen_ports:
            return False
        
        # Step 2: Count ESTABLISHED connections where LOCAL port = LISTEN port (inbound)
        for line in lines:
            if "ESTAB" in line:
                parts = line.split()
                # Local address is typically the 4th column in netstat, 4th in ss
                for i, part in enumerate(parts):
                    if ":" in part and i < len(parts) - 1:
                        local_port = part.rsplit(":", 1)[-1]
                        if local_port in listen_ports:
                            return True  # Found an inbound user connection
                        break
        
        return False
    except Exception:
        return False


def _watchdog_poll():
    """Synchronous poll function — runs in a thread to avoid blocking the event loop."""
    try:
        # Fetch all projects currently in RUNNING state
        res = supabase.table("projects").select("*").eq("status", "RUNNING").execute()
        current_time = time.time()
        
        for project in res.data:
            project_id = project["id"]
            container_name = f"deploy-{project_id[:8]}"
            
            # Frontend handling:
            # - Standalone frontends: never sleep (Nginx uses ~1MB RAM, negligible)
            # - Fullstack frontends: sleep only when BOTH are idle
            if project.get("project_type") == "frontend":
                linked_backend = None
                try:
                    linked = supabase.table("projects").select("id, status").eq(
                        "user_id", project.get("user_id")
                    ).eq("github_url", project.get("github_url")).eq(
                        "project_type", "backend"
                    ).execute()
                    if linked.data:
                        linked_backend = linked.data[0]
                except Exception:
                    pass
                
                if not linked_backend:
                    # Standalone frontend — keep it alive, restart if crashed
                    try:
                        container = docker_client.containers.get(container_name)
                        if container.status != "running":
                            container.start()
                    except Exception:
                        pass
                    continue
                
                # Fullstack frontend — follow the backend's lead
                if linked_backend.get("status") == "SLEEPING":
                    # Backend already asleep → sleep frontend immediately (same app, sleep together)
                    print(f"[Watchdog] Frontend {project_id[:8]} following backend to sleep.")
                    try:
                        container = docker_client.containers.get(container_name)
                        container.update(restart_policy={"Name": "no"})
                        container.stop(timeout=5)
                    except Exception as e:
                        print(f"[Watchdog] Error stopping frontend container: {e}")
                    supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                    redis_client.delete(f"last_active:{project_id}")
                    continue
                
                # Backend is RUNNING — skip sleep if it has RECENT activity
                if linked_backend.get("status") == "RUNNING":
                    backend_la = redis_client.get(f"last_active:{linked_backend['id']}")
                    if backend_la and (current_time - float(backend_la)) < config.WATCHDOG_IDLE_TIMEOUT:
                        continue  # Backend has genuine traffic, skip sleep
                # Fall through to normal idle check
            
            # Backend handling for fullstack projects:
            # Skip sleep if linked frontend has RECENT activity (user browsing).
            # DON'T refresh our own last_active (avoids circular keep-alive).
            if project.get("project_type") == "backend":
                linked_frontend = None
                try:
                    linked = supabase.table("projects").select("id, status").eq(
                        "user_id", project.get("user_id")
                    ).eq("github_url", project.get("github_url")).eq(
                        "project_type", "frontend"
                    ).execute()
                    if linked.data:
                        linked_frontend = linked.data[0]
                except Exception:
                    pass
                
                if linked_frontend and linked_frontend.get("status") == "RUNNING":
                    frontend_la = redis_client.get(f"last_active:{linked_frontend['id']}")
                    if frontend_la and (current_time - float(frontend_la)) < config.WATCHDOG_IDLE_TIMEOUT:
                        continue  # Frontend has genuine traffic, skip sleep
            
            # Verify container is actually running in Docker
            try:
                container = docker_client.containers.get(container_name)
                if container.status != "running":
                    supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                    continue
                # Detect crash loops — if container keeps restarting, mark as FAILED
                restart_count = container.attrs.get("RestartCount", 0)
                if restart_count > 5:
                    print(f"[Watchdog] Project {project_id[:8]} in crash loop ({restart_count} restarts). Marking as FAILED.")
                    container.update(restart_policy={"Name": "no"})
                    container.stop(timeout=2)
                    supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
                    continue
            except Exception:
                continue
            
            # Check Redis last_active timestamp (set by /service/ proxy)
            last_active_str = redis_client.get(f"last_active:{project_id}")
            if not last_active_str:
                redis_client.set(f"last_active:{project_id}", current_time)
                continue
            
            last_active = float(last_active_str)
            diff = current_time - last_active
            
            # Before sleeping: check for INBOUND user connections (direct port access)
            # This catches API calls that go to localhost:8001 directly, bypassing /service/
            # Only counts inbound HTTP connections, ignores outbound DB connections
            if diff > config.WATCHDOG_IDLE_TIMEOUT / 2:  # Only check when getting close to timeout
                if _has_inbound_connections(container_name):
                    redis_client.set(f"last_active:{project_id}", current_time)
                    continue
            
            if diff > config.WATCHDOG_IDLE_TIMEOUT:
                print(f"[Watchdog] Project {project_id[:8]} idle for {int(diff)}s (Threshold: {config.WATCHDOG_IDLE_TIMEOUT}s). Putting to sleep.")
                try:
                    container = docker_client.containers.get(container_name)
                    container.update(restart_policy={"Name": "no"})
                    container.stop(timeout=5)
                except Exception as e:
                    print(f"[Watchdog] Error stopping container {container_name}: {e}")
                
                supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                redis_client.delete(f"last_active:{project_id}")
    except Exception as e:
        print(f"[Watchdog] Error in poll: {e}")
