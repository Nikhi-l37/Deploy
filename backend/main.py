"""
Deploy — Main API Server
FastAPI application with Supabase JWT authentication and user-scoped project management.
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
import config
import webhook
from auth import get_current_user, get_user_id_from_supabase

# Initialize FastAPI app
app = FastAPI(
    title="Deploy",
    description="Mini Platform-as-a-Service — Deploy backend projects with one click.",
    version="1.0.0"
)

# Session middleware (needed for internal state handling)
app.add_middleware(SessionMiddleware, secret_key=config.FERNET_KEY or "fallback-secret-key")

# CORS — allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will restrict to specific domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(webhook.router)


# ---------- HEALTH CHECK (Public — no auth needed) ----------

@app.get("/")
def root():
    return {"status": "ok", "message": "Deploy API is running 🚀"}


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "max_containers": config.MAX_RUNNING_CONTAINERS,
        "max_apps_per_user": config.MAX_APPS_PER_USER,
    }


@app.get("/test-db")
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


# ---------- PROJECTS API (Authenticated + User-Scoped) ----------

@app.get("/projects")
async def get_projects(request: Request):
    """Fetch projects belonging to the authenticated user only."""
    from database import supabase
    try:
        # 1. Verify the user's token
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        # 2. Fetch only this user's projects
        res = supabase.table("projects").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        
        return {"status": "success", "data": res.data}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    """Delete a project: verify ownership, stop container, free port, remove DB records."""
    from database import supabase
    import docker
    
    try:
        # 1. Verify the user's token
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        # 2. Get the project info and verify ownership
        res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not res.data:
            return {"status": "error", "message": "Project not found"}
        
        project = res.data[0]
        
        # 3. Check that this project belongs to the current user
        if project.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You don't own this project")
        
        # 4. Stop and remove the Docker container if it exists
        if project.get("container_id"):
            try:
                client = docker.from_env()
                container = client.containers.get(project["container_id"])
                container.stop(timeout=5)
                container.remove()
            except Exception:
                pass  # Container may already be stopped
        
        # 5. Free the port in port_registry
        if project.get("port"):
            supabase.table("port_registry").update({
                "project_id": None,
                "in_use": False
            }).eq("project_id", project_id).execute()
        
        # 6. Delete deploy logs for this project
        supabase.table("deploy_logs").delete().eq("project_id", project_id).execute()
        
        # 7. Delete the cloned repository folder from the hard drive
        import shutil
        import tempfile
        import stat
        
        repo_path = os.path.join(tempfile.gettempdir(), "deployly", f"deploy-{project_id[:8]}")
        if os.path.exists(repo_path):
            def force_remove_readonly(func, path, excinfo):
                os.chmod(path, stat.S_IWRITE)
                func(path)
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
            
        # 8. Delete the project itself
        supabase.table("projects").delete().eq("id", project_id).execute()
        
        return {"status": "success", "message": "Project deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/projects/{project_id}/logs")
async def get_project_logs(project_id: str, request: Request):
    """Fetch build logs for a specific project (user must own it)."""
    from database import supabase
    import docker
    
    try:
        # Verify ownership
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Fetch build logs from DB
        res = supabase.table("deploy_logs").select("*").eq(
            "project_id", project_id
        ).order("created_at", desc=False).execute()
        
        logs = res.data
        
        # Try to fetch runtime logs from Docker
        try:
            client = docker.from_env()
            container_name = f"deploy-{project_id[:8]}"
            container = client.containers.get(container_name)
            
            container_logs = container.logs(tail=100).decode("utf-8")
            if container_logs:
                logs.append({
                    "message": "--- LIVE CONTAINER RUNTIME LOGS ---",
                    "created_at": "9999-12-31T23:59:58"
                })
                for line in container_logs.splitlines():
                    if line.strip():
                        logs.append({
                            "message": f"[APP] {line}",
                            "created_at": "9999-12-31T23:59:59"
                        })
        except Exception:
            pass  # Container not running or not found yet

        return {"status": "success", "data": logs}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ---------- ENV VARS API (Authenticated + User-Scoped) ----------

class EnvVarsUpdate(BaseModel):
    env_vars: Dict[str, str]


@app.get("/projects/{project_id}/env")
async def get_project_env(project_id: str, request: Request):
    """Fetch decrypted environment variables for a project (user must own it)."""
    from database import supabase
    from cryptography.fernet import Fernet
    
    try:
        # Verify ownership
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


@app.post("/projects/{project_id}/env")
async def save_project_env(project_id: str, body: EnvVarsUpdate, request: Request):
    """Save encrypted environment variables for a project (user must own it)."""
    from database import supabase
    from cryptography.fernet import Fernet
    
    try:
        # Verify ownership
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        f = Fernet(config.FERNET_KEY)
        
        # Delete existing env vars first
        supabase.table("env_vars").delete().eq("project_id", project_id).execute()
        
        # Insert new env vars
        inserts = []
        for key, value in body.env_vars.items():
            if not key.strip() or not value.strip():
                continue
            encrypted = f.encrypt(value.encode()).decode()
            inserts.append({
                "project_id": project_id,
                "key_name": key,
                "value_enc": encrypted
            })
            
        if inserts:
            supabase.table("env_vars").insert(inserts).execute()
            
        return {"status": "success", "message": "Environment variables saved successfully."}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ---------- SETTINGS API (Authenticated + User-Scoped) ----------

class ProjectSettings(BaseModel):
    root_directory: Optional[str] = "/"
    start_command: Optional[str] = ""


@app.put("/projects/{project_id}/settings")
async def update_project_settings(project_id: str, settings: ProjectSettings, request: Request):
    """Update root_directory and start_command for a project (user must own it)."""
    from database import supabase
    
    try:
        # Verify ownership
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        project_check = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_check.data or project_check.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        payload = {
            "root_directory": settings.root_directory,
            "start_command": settings.start_command
        }
        res = supabase.table("projects").update(payload).eq("id", project_id).execute()
        return {"status": "success", "data": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}
