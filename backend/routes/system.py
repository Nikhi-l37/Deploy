"""
Deploy — System & Health Endpoints
Public endpoints for health checks and connectivity diagnostics.
"""
from fastapi import APIRouter
import config

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
