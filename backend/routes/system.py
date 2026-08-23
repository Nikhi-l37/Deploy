"""
Deploy — System & Health Endpoints
Public endpoints for health checks and connectivity diagnostics.
"""
from fastapi import APIRouter
import config
import docker
import threading
import time

router = APIRouter(tags=["System"])

@router.get("/")
def root():
    return {"status": "ok", "message": "Deploy API is running 🚀"}

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "max_containers": config.MAX_RUNNING_CONTAINERS,
        "max_apps_per_user": config.MAX_APPS_PER_USER,
        "watchdog_timeout": config.WATCHDOG_IDLE_TIMEOUT
    }

@router.get("/test-db")
def test_db():
    from database import supabase
    if not supabase:
        return {"status": "error", "message": "Supabase client not initialized. Check .env"}
    
    try:
        res = supabase.table("port_registry").select("*").limit(3).execute()
        return {
            "status": "success",
            "message": "Successfully connected to Supabase!",
            "data": res.data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ---------- Resource Monitoring ----------
docker_client = docker.from_env()
_resource_cache = {"data": [], "server_mem_mb": 2048, "timestamp": 0}
_cache_lock = threading.Lock()

def _refresh_resource_cache():
    """Refresh container resource stats (called at most every 30s)."""
    try:
        containers = docker_client.containers.list(all=True, filters={"name": "deploy-"})
        stats = []
        for c in containers:
            try:
                if c.status == "running":
                    s = c.stats(stream=False)
                    mem_usage = s.get("memory_stats", {}).get("usage", 0)
                    mem_limit = s.get("memory_stats", {}).get("limit", 0)
                else:
                    mem_usage = 0
                    mem_limit = 0
                
                image_size = 0
                try:
                    image_size = c.image.attrs.get("Size", 0)
                except Exception:
                    pass
                
                stats.append({
                    "container_name": c.name,
                    "status": c.status,
                    "mem_usage_mb": round(mem_usage / 1024 / 1024, 1),
                    "mem_limit_mb": round(mem_limit / 1024 / 1024, 1) if mem_limit else int(config.CONTAINER_MEM_LIMIT.replace('m', '').replace('g', '')),
                    "image_size_mb": round(image_size / 1024 / 1024, 1),
                })
            except Exception:
                continue
        
        with _cache_lock:
            _resource_cache["data"] = stats
            _resource_cache["timestamp"] = time.time()
    except Exception as e:
        print(f"[Resources] Error refreshing cache: {e}")

@router.get("/system/resources")
def get_resources():
    """Returns per-container memory/storage usage. Cached for 30s."""
    with _cache_lock:
        if time.time() - _resource_cache["timestamp"] > 30:
            _refresh_resource_cache()
    
    return {
        "status": "success",
        "data": _resource_cache["data"],
        "container_mem_limit_mb": int(config.CONTAINER_MEM_LIMIT.replace('m', '').replace('g', '')),
        "max_apps_per_user": config.MAX_APPS_PER_USER,
    }
