"""
Deploy — Logs Router
Fetches build logs from Supabase and live runtime output directly from Docker containers.
"""
from fastapi import APIRouter, Request, HTTPException
import docker
import uuid
from database import supabase
from auth import get_current_user, get_user_id_from_supabase

router = APIRouter(prefix="/projects", tags=["Logs"])
docker_client = docker.from_env()

@router.get("/{project_id}/logs")
async def get_project_logs(project_id: str, request: Request):
    """Fetch build logs and runtime logs for a specific project (owner authenticated)."""
    try:
        # Verify user ownership
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # 1. Fetch persistent build logs from Supabase
        res = supabase.table("deploy_logs").select("*").eq(
            "project_id", project_id
        ).order("created_at", desc=False).execute()
        
        logs = res.data or []
        
        # 2. Try to append live runtime logs from Docker container if running
        try:
            client = docker_client
            container_name = f"deploy-{project_id[:8]}"
            container = client.containers.get(container_name)
            
            container_logs = container.logs(tail=100).decode("utf-8", errors="replace")
            if container_logs:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc).isoformat()
                logs.append({
                    "id": str(uuid.uuid4()),
                    "log_text": "--- LIVE CONTAINER RUNTIME LOGS ---",
                    "created_at": now
                })
                for line in container_logs.splitlines():
                    if line.strip():
                        logs.append({
                            "id": str(uuid.uuid4()),
                            "log_text": f"[APP] {line}",
                            "created_at": now
                        })
        except Exception:
            pass  # Container not running or not created yet
            
        return {"status": "success", "data": logs}
        
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}
