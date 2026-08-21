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
    title="Deployat PaaS",
    description="Mini Platform-as-a-Service — Deploy projects with one click.",
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

import asyncio
import time
import docker
import redis
from database import supabase

# Register Routers
app.include_router(webhook.router)

redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)

# ---------- AUTO-SLEEP WATCHDOG ----------

async def watchdog_task():
    """Background task to pause idle containers.
    
    Uses two signals to detect activity:
    1. Redis last_active timestamp (set on deployment and gateway access)
    """
    
    while True:
        try:
            # Get all RUNNING projects
            res = supabase.table("projects").select("*").eq("status", "RUNNING").execute()
            current_time = time.time()
            client = docker.from_env()
            
            for project in res.data:
                project_id = project["id"]
                container_name = f"deploy-{project_id[:8]}"
                
                # Skip frontend projects — static sites use nginx and consume
                # almost zero resources, so sleeping them is pointless
                if project.get("project_type") == "frontend":
                    print(f"[Watchdog] Skipping {project_id[:8]} — frontend project, no sleep needed.")
                    continue
                
                # Verify container is actually running
                try:
                    container = client.containers.get(container_name)
                    if container.status != "running":
                        continue
                except Exception:
                    continue
                
                # Check the Redis last_active timestamp
                last_active_str = redis_client.get(f"last_active:{project_id}")
                
                if not last_active_str:
                    # First time seeing this project, give it a grace period
                    redis_client.set(f"last_active:{project_id}", current_time)
                    continue
                
                last_active = float(last_active_str)
                if current_time - last_active > config.WATCHDOG_IDLE_TIMEOUT:
                    # No traffic AND idle for timeout — time to sleep!
                    print(f"[Watchdog] Project {project_id} idle for {config.WATCHDOG_IDLE_TIMEOUT}s. Putting to sleep.")
                    try:
                        container = client.containers.get(container_name)
                        container.stop(timeout=5)
                    except Exception as e:
                        print(f"[Watchdog] Error stopping container: {e}")
                    
                    supabase.table("projects").update({"status": "SLEEPING"}).eq("id", project_id).execute()
                    redis_client.delete(f"last_active:{project_id}")
        except Exception as e:
            print(f"[Watchdog] Loop error: {e}")
            
        await asyncio.sleep(config.WATCHDOG_POLL_INTERVAL)

import threading
import builder

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(watchdog_task())
    # Auto-start builder queue worker thread so deploys process automatically
    try:
        worker_thread = threading.Thread(target=builder.start_worker, daemon=True)
        worker_thread.start()
        print("[Startup] Builder Worker background daemon thread started.")
    except Exception as e:
        print(f"[Startup] Error starting builder worker thread: {e}")


# ---------- WAKE-ON-DEMAND GATEWAY ----------

@app.get("/gateway/{project_id}")
async def gateway(project_id: str):
    """
    Nginx calls this endpoint (auth_request) before proxying traffic.
    If the app is RUNNING, we update last_active.
    If the app is SLEEPING, we wake it up and then allow traffic.
    """
    res = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = res.data[0]
    status = project["status"]
    
    if status == "RUNNING":
        # Just update activity ping
        redis_client.set(f"last_active:{project_id}", time.time())
        return {"status": "ok"}
        
    elif status == "SLEEPING":
        # Wake it up!
        try:
            client = docker.from_env()
            container_name = f"deploy-{project_id[:8]}"
            container = client.containers.get(container_name)
            container.start()
            
            # Wait for the app inside the container to be ready
            port = project.get("port", 8001)
            import socket
            for attempt in range(10):
                await asyncio.sleep(1)
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex(('127.0.0.1', port))
                    sock.close()
                    if result == 0:
                        break
                except:
                    pass
            
            supabase.table("projects").update({"status": "RUNNING"}).eq("id", project_id).execute()
            redis_client.set(f"last_active:{project_id}", time.time())
            return {"status": "woken up"}
        except Exception as e:
            print(f"Gateway error waking container: {e}")
            raise HTTPException(status_code=500, detail="Failed to wake container")
            
    else:
        # App is QUEUED, BUILDING, or FAILED. Block traffic.
        raise HTTPException(status_code=503, detail="App is not ready to serve traffic")


# ---------- WAKE-UP PAGE (Render-style loading screen) ----------

from fastapi.responses import HTMLResponse

@app.get("/wake-page/{project_id}", response_class=HTMLResponse)
async def wake_page(project_id: str):
    """
    Serves a beautiful 'Waking up your server...' page.
    The page auto-calls /gateway/{project_id} to boot the container,
    polls until it's RUNNING, then redirects to the app URL.
    """
    res = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = res.data[0]
    port = project.get("port", 8001)
    
    # Redirect to subdomain if configured, else fallback to port
    if project.get("subdomain") and config.DOMAIN_NAME != "deploy.local":
        app_url = f"https://{project['subdomain']}.{config.DOMAIN_NAME}"
    else:
        app_url = f"{config.HOST_URL}:{port}"
        
    project_name = project.get("github_url", "").split("/")[-1].replace(".git", "") or "Your App"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Waking up · {project_name} · Deployat</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            
            body {{
                font-family: 'Inter', -apple-system, sans-serif;
                background: #030712;
                color: #e2e8f0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }}
            
            /* Animated background */
            .bg-glow {{
                position: fixed;
                width: 400px;
                height: 400px;
                border-radius: 50%;
                filter: blur(120px);
                opacity: 0.15;
                animation: drift 8s ease-in-out infinite;
            }}
            .bg-glow.purple {{ background: #8b5cf6; top: -100px; left: -100px; }}
            .bg-glow.blue {{ background: #3b82f6; bottom: -100px; right: -100px; animation-delay: 4s; }}
            
            @keyframes drift {{
                0%, 100% {{ transform: translate(0, 0); }}
                50% {{ transform: translate(30px, 20px); }}
            }}
            
            .card {{
                position: relative;
                z-index: 10;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(24px);
                border: 1px solid rgba(148, 163, 184, 0.1);
                border-radius: 24px;
                padding: 48px;
                max-width: 440px;
                width: 90%;
                text-align: center;
                box-shadow: 0 0 60px rgba(0,0,0,0.4);
            }}
            
            /* Spinner */
            .spinner-container {{
                margin: 0 auto 32px;
                width: 64px;
                height: 64px;
                position: relative;
            }}
            .spinner {{
                width: 64px;
                height: 64px;
                border-radius: 50%;
                border: 3px solid rgba(139, 92, 246, 0.1);
                border-top-color: #8b5cf6;
                animation: spin 1s linear infinite;
            }}
            .spinner-icon {{
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 24px;
                animation: pulse-icon 2s ease-in-out infinite;
            }}
            
            @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
            @keyframes pulse-icon {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.5; }} }}
            
            h1 {{
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 8px;
                background: linear-gradient(to right, #fff, #94a3b8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            
            .subtitle {{
                color: #64748b;
                font-size: 14px;
                margin-bottom: 32px;
                line-height: 1.5;
            }}
            
            .project-name {{
                color: #a78bfa;
                font-weight: 600;
            }}
            
            /* Progress steps */
            .steps {{
                text-align: left;
                margin-bottom: 28px;
            }}
            .step {{
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                border-radius: 10px;
                font-size: 13px;
                color: #475569;
                transition: all 0.4s ease;
                margin-bottom: 4px;
            }}
            .step.active {{
                color: #e2e8f0;
                background: rgba(139, 92, 246, 0.08);
            }}
            .step.done {{
                color: #22c55e;
            }}
            .step-dot {{
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #334155;
                flex-shrink: 0;
                transition: all 0.3s ease;
            }}
            .step.active .step-dot {{
                background: #8b5cf6;
                box-shadow: 0 0 8px #8b5cf6;
                animation: pulse-dot 1.5s ease-in-out infinite;
            }}
            .step.done .step-dot {{
                background: #22c55e;
                box-shadow: 0 0 8px #22c55e;
            }}
            
            @keyframes pulse-dot {{
                0%, 100% {{ transform: scale(1); }}
                50% {{ transform: scale(1.4); }}
            }}
            
            .status-text {{
                font-size: 12px;
                color: #475569;
                margin-top: 4px;
            }}
            
            .error-msg {{
                color: #f87171;
                font-size: 13px;
                margin-top: 16px;
                display: none;
            }}
        </style>
    </head>
    <body>
        <div class="bg-glow purple"></div>
        <div class="bg-glow blue"></div>
        
        <div class="card">
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-icon">🚀</div>
            </div>
            
            <h1>Waking up your server</h1>
            <p class="subtitle">
                <span class="project-name">{project_name}</span> is sleeping to save resources.<br>
                We're spinning it back up for you.
            </p>
            
            <div class="steps">
                <div class="step active" id="step1">
                    <div class="step-dot"></div>
                    <span>Starting Docker container...</span>
                </div>
                <div class="step" id="step2">
                    <div class="step-dot"></div>
                    <span>Waiting for application to boot...</span>
                </div>
                <div class="step" id="step3">
                    <div class="step-dot"></div>
                    <span>Redirecting you to your app...</span>
                </div>
            </div>
            
            <p class="status-text" id="statusText">This usually takes 5-10 seconds</p>
            <p class="error-msg" id="errorMsg">Something went wrong. Please try refreshing.</p>
        </div>
        
        <script>
            const GATEWAY_URL = "{config.API_BASE_URL}/gateway/{project_id}";
            const APP_URL = "{app_url}";
            
            const step1 = document.getElementById("step1");
            const step2 = document.getElementById("step2");
            const step3 = document.getElementById("step3");
            const statusText = document.getElementById("statusText");
            const errorMsg = document.getElementById("errorMsg");
            
            function setStep(stepNum) {{
                if (stepNum >= 2) {{
                    step1.className = "step done";
                    step2.className = "step active";
                }}
                if (stepNum >= 3) {{
                    step2.className = "step done";
                    step3.className = "step active";
                }}
            }}
            
            async function wakeUp() {{
                try {{
                    // Step 1: Call the gateway to start the container
                    const res = await fetch(GATEWAY_URL);
                    const data = await res.json();
                    
                    if (res.ok) {{
                        // Step 2: Container started, wait for app to boot
                        setStep(2);
                        statusText.textContent = "Container started! Waiting for app...";
                        
                        // Give the app a moment to fully initialize
                        await new Promise(r => setTimeout(r, 2000));
                        
                        // Step 3: Redirect
                        setStep(3);
                        statusText.textContent = "Ready! Redirecting now...";
                        
                        await new Promise(r => setTimeout(r, 800));
                        window.location.href = APP_URL;
                    }} else {{
                        throw new Error(data.detail || "Failed to wake container");
                    }}
                }} catch (err) {{
                    console.error("Wake error:", err);
                    statusText.textContent = "Retrying...";
                    
                    // Retry after 3 seconds
                    setTimeout(wakeUp, 3000);
                }}
            }}
            
            // Start the wake-up process immediately
            wakeUp();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


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
        try:
            client = docker.from_env()
            container_name = f"deploy-{project_id[:8]}"
            # Try by container_id first
            if project.get("container_id"):
                try:
                    container = client.containers.get(project["container_id"])
                    container.stop(timeout=1)
                    container.remove(force=True)
                except Exception:
                    pass
            # Fallback try by name
            try:
                container = client.containers.get(container_name)
                container.stop(timeout=1)
                container.remove(force=True)
            except Exception:
                pass
        except Exception:
            pass
        
        # 5. Free the port in port_registry (always try, even for FAILED projects)
        supabase.table("port_registry").update({
            "project_id": None,
            "in_use": False
        }).eq("project_id", project_id).execute()
        
        # 6. Delete env vars for this project
        supabase.table("env_vars").delete().eq("project_id", project_id).execute()
        
        # 7. Delete deploy logs for this project
        supabase.table("deploy_logs").delete().eq("project_id", project_id).execute()
        
        # 8. Delete the cloned repository folder from the hard drive
        import shutil
        import tempfile
        import stat
        
        repo_path = os.path.join(tempfile.gettempdir(), "deployly", f"deploy-{project_id[:8]}")
        if os.path.exists(repo_path):
            def force_remove_readonly(func, path, excinfo):
                os.chmod(path, stat.S_IWRITE)
                func(path)
            shutil.rmtree(repo_path, onerror=force_remove_readonly)
        
        # 9. Remove Docker image
        try:
            client = docker.from_env()
            client.images.remove(f"deploy-{project_id[:8]}", force=True)
        except Exception:
            pass
        
        # 10. Delete the project itself
        supabase.table("projects").delete().eq("id", project_id).execute()
        
        # 11. Regenerate nginx config (removes the subdomain)
        try:
            import nginx_config
            nginx_config.generate_nginx_config()
        except Exception:
            pass
        
        # 12. Clean up Redis
        redis_client.delete(f"last_active:{project_id}")
        
        return {"status": "success", "message": "Project deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/projects/{project_id}/restart")
async def restart_project(project_id: str, request: Request):
    """Restart a container without rebuilding. Much faster than redeploy."""
    user = await get_current_user(request)
    user_id = await get_user_id_from_supabase(user)
    
    try:
        res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = res.data[0]
        if project.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You don't own this project")
        
        if not project.get("container_id"):
            raise HTTPException(status_code=400, detail="No container to restart. Deploy first.")
        
        client = docker.from_env()
        container_name = f"deploy-{project_id[:8]}"
        
        try:
            container = client.containers.get(container_name)
            container.restart(timeout=5)
            
            # Wait for it to come back up
            time.sleep(3)
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
                import uuid
                logs.append({
                    "id": str(uuid.uuid4()),
                    "log_text": "--- LIVE CONTAINER RUNTIME LOGS ---",
                    "created_at": "9999-12-31T23:59:58"
                })
                for line in container_logs.splitlines():
                    if line.strip():
                        logs.append({
                            "id": str(uuid.uuid4()),
                            "log_text": f"[APP] {line}",
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
    name: Optional[str] = None
    root_directory: Optional[str] = "/"
    start_command: Optional[str] = ""


@app.put("/projects/{project_id}/settings")
async def update_project_settings(project_id: str, settings: ProjectSettings, request: Request):
    """Update name, root_directory and start_command for a project (user must own it)."""
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
        if settings.name is not None and settings.name.strip():
            payload["name"] = settings.name.strip()
            
        try:
            res = supabase.table("projects").update(payload).eq("id", project_id).execute()
        except Exception as err:
            # Fallback if name column is not present in existing database schema
            if "name" in str(err).lower():
                payload.pop("name", None)
                res = supabase.table("projects").update(payload).eq("id", project_id).execute()
            else:
                raise err
                
        return {"status": "success", "data": res.data[0] if res.data else {}}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}
