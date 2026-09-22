"""
Deploy — Auto-Sleep Watchdog Daemon
Monitors idle containers and safely puts them to sleep to conserve system resources.

Each project is INDEPENDENT — sleeps based on its own last_active timestamp.
The /service/ proxy updates last_active on every request (the single source of truth).
"""
import asyncio
import time
import docker
import redis
import config
from database import supabase

redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
docker_client = docker.from_env()

_consecutive_errors = 0
_MAX_SILENT_ERRORS = 3  # Log first N errors, then suppress repeats

async def watchdog_task():
    """Background task to pause idle containers.
    
    Monitors Redis last_active timestamps set by the /service/ proxy.
    When a container has had no user traffic for WATCHDOG_IDLE_TIMEOUT,
    it is safely stopped and marked as SLEEPING in Supabase.
    """
    global _consecutive_errors
    print(f"[Watchdog] Daemon started (Timeout: {config.WATCHDOG_IDLE_TIMEOUT}s, Interval: {config.WATCHDOG_POLL_INTERVAL}s)")
    
    while True:
        try:
            await asyncio.to_thread(_watchdog_poll)
            if _consecutive_errors > 0:
                print(f"[Watchdog] Recovered after {_consecutive_errors} consecutive errors.")
                _consecutive_errors = 0
        except Exception as e:
            _consecutive_errors += 1
            if _consecutive_errors <= _MAX_SILENT_ERRORS:
                print(f"[Watchdog] Error in poll ({_consecutive_errors}): {e}")
            elif _consecutive_errors % 6 == 0:
                print(f"[Watchdog] Still failing ({_consecutive_errors} consecutive errors): {e}")
            
        # Back off on repeated failures (10s normal, up to 60s on persistent errors)
        backoff = min(config.WATCHDOG_POLL_INTERVAL * (2 if _consecutive_errors > _MAX_SILENT_ERRORS else 1), 60)
        await asyncio.sleep(backoff)


def _watchdog_poll():
    """Synchronous poll function — runs in a thread to avoid blocking the event loop.
    
    Simple algorithm:
      For each RUNNING project:
        1. Verify container is actually running (handle crashes)
        2. Check last_active timestamp from Redis
        3. If idle > timeout, sleep the container
    """
    try:
        # Fetch all projects currently in RUNNING state
        res = supabase.table("projects").select("*").eq("status", "RUNNING").execute()
        current_time = time.time()
        
        for project in res.data:
            project_id = project["id"]
            container_name = f"deploy-{project_id[:8]}"
            
            # Skip frontends — Nginx uses ~1-2MB RAM (negligible), and since
            # browser GETs redirect to direct port (bypassing /service/ proxy),
            # last_active never updates, causing false idle detection
            if project.get("project_type") == "frontend":
                continue
            
            # --- 1. Verify container is actually running in Docker ---
            try:
                container = docker_client.containers.get(container_name)
                if container.status != "running":
                    # Check if container crashed vs was intentionally stopped
                    exit_code = container.attrs.get("State", {}).get("ExitCode", 0)
                    if exit_code != 0:
                        # Container crashed (OOM, unhandled exception, etc.)
                        print(f"[Watchdog] Project {project_id[:8]} crashed (exit code {exit_code}). Marking as FAILED.")
                        supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
                    else:
                        supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                    continue
                # Detect crash loops
                restart_count = container.attrs.get("RestartCount", 0)
                if restart_count > 5:
                    print(f"[Watchdog] Project {project_id[:8]} in crash loop ({restart_count} restarts). Marking as FAILED.")
                    container.update(restart_policy={"Name": "no"})
                    container.stop(timeout=2)
                    supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
                    # Release the port so it can be reused
                    try:
                        supabase.table("port_registry").update({
                            "in_use": False, "project_id": None
                        }).eq("project_id", project_id).execute()
                    except Exception:
                        pass
                    continue
            except docker.errors.NotFound:
                # Container was deleted externally or pruned — mark as SLEEPING and release port
                print(f"[Watchdog] Container {container_name} not found in Docker. Marking as SLEEPING.")
                supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                try:
                    supabase.table("port_registry").update({
                        "in_use": False, "project_id": None
                    }).eq("project_id", project_id).execute()
                except Exception:
                    pass
                continue
            except Exception:
                continue
            
            # --- 2. Check Redis last_active timestamp (set by /service/ proxy) ---
            last_active_str = redis_client.get(f"last_active:{project_id}")
            if not last_active_str:
                # First time seeing this project
                redis_client.set(f"last_active:{project_id}", current_time)
                continue
            
            last_active = float(last_active_str)
            diff = current_time - last_active
            
            # --- 3. If idle > timeout, sleep the container ---
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
