"""
Deploy — Main API Server
FastAPI application with Supabase JWT authentication and modular routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import asyncio
import threading
import os
import config
import builder
import webhook
from watchdog import watchdog_task

# Import modular routers
from routes import system, projects, logs, env_vars, gateway

# ---------- FASTAPI LIFESPAN LIFECYCLE ----------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages background daemons on server startup & graceful shutdown."""
    print("[Startup] Initializing background daemons (Watchdog & Builder Worker)...", flush=True)
    watchdog = asyncio.create_task(watchdog_task())
    try:
        worker_thread = threading.Thread(target=builder.start_worker, daemon=True)
        worker_thread.start()
        print("[Startup] Builder Worker background daemon thread started.", flush=True)
    except Exception as e:
        print(f"[Startup] Error starting builder worker thread: {e}", flush=True)
    yield
    # Graceful shutdown
    print("[Shutdown] Terminating background daemons...", flush=True)
    watchdog.cancel()
    builder.shutdown_event.set()
    print("[Shutdown] Builder Worker signaled to stop.", flush=True)

# Initialize FastAPI app with Lifespan
app = FastAPI(
    title="Deployat PaaS",
    description="Mini Platform-as-a-Service — Deploy projects with one click.",
    version="1.0.0",
    lifespan=lifespan
)

# Session middleware
app.add_middleware(SessionMiddleware, secret_key=config.FERNET_KEY)

# CORS middleware — allow_origins=["*"] with credentials is rejected by browsers
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Modular Routers
app.include_router(system.router)
app.include_router(webhook.router)
app.include_router(projects.router)
app.include_router(logs.router)
app.include_router(env_vars.router)
app.include_router(gateway.router)

# ---------- SPA CATCH-ALL FALLBACK ----------
# Must be LAST — catches SPA routes (e.g., /retention, /about) when user refreshes.
# These are client-side React Router paths that don't exist in FastAPI.
# Uses the Referer header to redirect back to /service/{id}/{path}.
from fastapi import Request
from fastapi.responses import RedirectResponse, JSONResponse
import re as _re

@app.api_route("/{path:path}", methods=["GET"], include_in_schema=False)
async def spa_catch_all(path: str, request: Request):
    # Skip API-like paths (they should return proper 404, not redirect)
    if path.startswith(("api/", "docs", "openapi", "webhook", "projects", "logs", "env-vars")):
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    
    referer = request.headers.get("referer", "")
    match = _re.search(r'/service/([a-f0-9-]+)', referer)
    
    if match:
        project_short_id = match.group(1)
        redirect_url = f"/service/{project_short_id}/{path}"
        if request.url.query:
            redirect_url += f"?{request.url.query}"
        print(f"[SPA Fallback] Redirecting /{path} -> {redirect_url}")
        return RedirectResponse(url=redirect_url, status_code=307)
    
    return JSONResponse(status_code=404, content={"detail": "Not found"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=True)
