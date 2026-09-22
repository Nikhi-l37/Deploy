"""
Deploy — Environment Variables Router
Manages encrypted environment variables stored with Fernet at rest.
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Dict
from cryptography.fernet import Fernet
import config
import docker
from database import supabase
from auth import get_current_user, get_user_id_from_supabase

router = APIRouter(prefix="/projects", tags=["Environment Variables"])

class EnvVarsUpdate(BaseModel):
    env_vars: Dict[str, str]

@router.get("/{project_id}/env")
async def get_project_env(project_id: str, request: Request):
    """Fetch decrypted environment variables for a project (owner authenticated)."""
    try:
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        f = Fernet(config.FERNET_KEY)
        res = supabase.table("env_vars").select("*").eq("project_id", project_id).execute()
        
        env_dict = {}
        for ev in res.data:
            decrypted = f.decrypt(ev["value_enc"].encode()).decode()
            env_dict[ev["key_name"]] = decrypted
            
        return {"status": "success", "data": env_dict}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/{project_id}/env")
async def update_project_env(project_id: str, payload: EnvVarsUpdate, request: Request):
    """Encrypt and save environment variables for a project."""
    try:
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        f = Fernet(config.FERNET_KEY)
        
        # Build new env var records
        new_keys = []
        inserts = []
        for key, val in payload.env_vars.items():
            k_clean = str(key).strip()
            v_clean = str(val) if val is not None else ""
            if k_clean:  # Allow empty values (e.g. DEBUG="")
                encrypted = f.encrypt(v_clean.encode()).decode()
                inserts.append({
                    "project_id": project_id,
                    "key_name": k_clean,
                    "value_enc": encrypted
                })
                new_keys.append(k_clean)
        
        # Insert new vars first to prevent data loss on crash
        if inserts:
            # Delete existing vars that will be replaced
            supabase.table("env_vars").delete().eq("project_id", project_id).in_("key_name", new_keys).execute()
            supabase.table("env_vars").insert(inserts).execute()
        
        # Remove keys that are no longer in the updated set
        if new_keys:
            existing = supabase.table("env_vars").select("key_name").eq("project_id", project_id).execute()
            stale_keys = [e["key_name"] for e in existing.data if e["key_name"] not in new_keys]
            if stale_keys:
                for sk in stale_keys:
                    supabase.table("env_vars").delete().eq("project_id", project_id).eq("key_name", sk).execute()
        else:
            # If no new keys provided, delete all existing
            supabase.table("env_vars").delete().eq("project_id", project_id).execute()
            
        # Auto-restart running container so new env vars take effect
        restarted = False
        needs_redeploy = False
        build_time_keys = [k for k in new_keys if k.startswith(('VITE_', 'REACT_APP_', 'NEXT_PUBLIC_'))]
        if build_time_keys:
            needs_redeploy = True  # These are baked into JS at build time
        
        try:
            project_status = supabase.table("projects").select("status").eq("id", project_id).execute()
            if project_status.data and project_status.data[0].get("status") == "RUNNING":
                container_name = f"deploy-{project_id[:8]}"
                docker_client = docker.from_env()
                container = docker_client.containers.get(container_name)
                container.restart(timeout=5)
                restarted = True
        except Exception:
            pass  # Container might not exist or be stopped
            
        result = {"status": "success", "message": "Environment variables saved successfully", "restarted": restarted}
        if needs_redeploy:
            result["needs_redeploy"] = True
            result["build_time_keys"] = build_time_keys
        return result
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}
