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
    
    Monitors Redis last_active timestamps.
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

def _watchdog_poll():
    """Synchronous poll function — runs in a thread to avoid blocking the event loop."""
    try:
        # Fetch all projects currently in RUNNING state
        res = supabase.table("projects").select("*").eq("status", "RUNNING").execute()
        current_time = time.time()
        
        for project in res.data:
            project_id = project["id"]
            container_name = f"deploy-{project_id[:8]}"
            
            # Frontend static Nginx apps consume negligible resources (~1MB RAM); keep them online
            if project.get("project_type") == "frontend":
                try:
                    container = docker_client.containers.get(container_name)
                    if container.status != "running":
                        container.start()
                except Exception:
                    pass
                continue
            
            # Verify container is actually running in Docker
            try:
                container = docker_client.containers.get(container_name)
                if container.status != "running":
                    supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                    continue
            except Exception:
                continue
            
            # Check Redis last_active timestamp
            last_active_str = redis_client.get(f"last_active:{project_id}")
            if not last_active_str:
                redis_client.set(f"last_active:{project_id}", current_time)
                continue
            
            last_active = float(last_active_str)
            diff = current_time - last_active
            
            if diff > config.WATCHDOG_IDLE_TIMEOUT:
                print(f"[Watchdog] Project {project_id[:8]} idle for {int(diff)}s (Threshold: {config.WATCHDOG_IDLE_TIMEOUT}s). Putting to sleep.")
                try:
                    container = docker_client.containers.get(container_name)
                    # Disable restart policy BEFORE stopping, so Docker doesn't auto-restart it
                    container.update(restart_policy={"Name": "no"})
                    container.stop(timeout=5)
                except Exception as e:
                    print(f"[Watchdog] Error stopping container {container_name}: {e}")
                
                supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                redis_client.delete(f"last_active:{project_id}")
                redis_client.delete(f"last_bytes:{project_id}")
    except Exception as e:
        print(f"[Watchdog] Error in poll: {e}")
