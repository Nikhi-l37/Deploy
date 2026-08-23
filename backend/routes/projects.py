"""
Deploy — Projects Router
Manages user project listings, updating configuration (name, rootDir, startCmd),
restarting containers, and full project deletion with resource cleanup.
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import docker
import time
import os
import shutil
import tempfile
import stat
import asyncio
import redis
import config
from database import supabase
from auth import get_current_user, get_user_id_from_supabase

router = APIRouter(prefix="/projects", tags=["Projects"])
redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
docker_client = docker.from_env()

class ProjectSettingsUpdate(BaseModel):
    name: Optional[str] = None
    root_directory: Optional[str] = None
    start_command: Optional[str] = None

@router.get("")
async def get_projects(request: Request):
    """Fetch all projects belonging to the authenticated user."""
    try:
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        res = supabase.table("projects").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        
        return {"status": "success", "data": res.data}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.patch("/{project_id}")
async def update_project_settings(project_id: str, payload: ProjectSettingsUpdate, request: Request):
    """Update project settings (name, root_directory, start_command)."""
    try:
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        update_data = {}
        if payload.name is not None:
            update_data["name"] = payload.name.strip()
        if payload.root_directory is not None:
            update_data["root_directory"] = payload.root_directory.strip() or "/"
        if payload.start_command is not None:
            update_data["start_command"] = payload.start_command.strip()
            
        if update_data:
            supabase.table("projects").update(update_data).eq("id", project_id).execute()
            
        return {"status": "success", "message": "Project settings updated"}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/{project_id}/restart")
async def restart_project(project_id: str, request: Request):
    """Restart a container (~2s) without a full image rebuild."""
    try:
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not res.data or res.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        client = docker_client
        container_name = f"deploy-{project_id[:8]}"
        
        try:
            container = client.containers.get(container_name)
            container.restart(timeout=5)
            await asyncio.sleep(2)
            container.reload()
            
            if container.status == "running":
                supabase.table("projects").update({"status": "RUNNING"}).eq("id", project_id).execute()
                redis_client.set(f"last_active:{project_id}", time.time())
                return {"status": "success", "message": "Container restarted successfully!"}
            else:
                supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
                raise HTTPException(status_code=500, detail="Container failed to restart")
        except docker.errors.NotFound:
            raise HTTPException(status_code=404, detail="Container not found. Try redeploying instead.")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(project_id: str, request: Request):
    """Delete a project: verify ownership, stop & remove container, free port, clean up DB."""
    try:
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not res.data:
            return {"status": "error", "message": "Project not found"}
        
        project = res.data[0]
        if project.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You don't own this project")
        
        # 1. Stop and remove Docker container
        try:
            client = docker_client
            container_name = f"deploy-{project_id[:8]}"
            try:
                container = client.containers.get(container_name)
                container.stop(timeout=1)
                container.remove(force=True)
            except Exception:
                pass
        except Exception:
            pass
        
        # 2. Free port registry
        supabase.table("port_registry").update({
            "project_id": None,
            "in_use": False
        }).eq("project_id", project_id).execute()
        
        # 3. Clean up DB records
        supabase.table("env_vars").delete().eq("project_id", project_id).execute()
        supabase.table("deploy_logs").delete().eq("project_id", project_id).execute()
        
        # 4. Clean up cloned repo on disk
        repo_path = os.path.join(tempfile.gettempdir(), "deployly", f"deploy-{project_id[:8]}")
        if os.path.exists(repo_path):
            def force_remove_readonly(func, path, excinfo):
                os.chmod(path, stat.S_IWRITE)
                func(path)
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
            
        # 5. Remove Docker image
        try:
            client = docker_client
            client.images.remove(f"deploy-{project_id[:8]}", force=True)
        except Exception:
            pass
            
        # 6. Delete project record
        supabase.table("projects").delete().eq("id", project_id).execute()
        
        # 7. Clean up Redis
        redis_client.delete(f"last_active:{project_id}")
        redis_client.delete(f"last_bytes:{project_id}")
        
        return {"status": "success", "message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}
