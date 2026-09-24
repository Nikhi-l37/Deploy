"""
Deploy — Main API Server
FastAPI application with Supabase JWT authentication and modular routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import asyncio
import threading
import config
import builder
import webhook
from watchdog import watchdog_task

# Import modular routers
from routes import system, projects, logs, env_vars, gateway, ws_logs

# ---------- FASTAPI LIFESPAN LIFECYCLE ----------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages background daemons on server startup & graceful shutdown."""
    # Auto-seed port_registry table with any missing ports from the configured range
    from database import supabase
    try:
        existing = supabase.table("port_registry").select("port").execute()
        existing_ports = {row["port"] for row in existing.data}
        new_ports = []
        for p in range(config.PORT_RANGE_START, config.PORT_RANGE_END + 1):
            if p not in existing_ports:
                new_ports.append({"port": p, "in_use": False, "project_id": None})
        if new_ports:
            supabase.table("port_registry").insert(new_ports).execute()
            print(f"[Startup] Added {len(new_ports)} new ports to registry ({new_ports[0]['port']}-{new_ports[-1]['port']})", flush=True)
        else:
            print(f"[Startup] Port registry OK ({len(existing_ports)} ports)", flush=True)
    except Exception as e:
        print(f"[Startup] Port registry init warning: {e}", flush=True)
    
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

# Initialize rate limiter (Redis-backed for production, in-memory fallback)
limiter = Limiter(key_func=get_remote_address, storage_uri=config.REDIS_URL)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Session middleware


# CORS middleware — allow localhost (dev) + production domain + deployed user app ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://localhost:3000",    # Alternate dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8888",
        "http://127.0.0.1:8888",
        f"https://{config.DOMAIN_NAME}",
        f"http://{config.DOMAIN_NAME}",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|" + config.DOMAIN_NAME.replace(".", r"\.") + r")(:\d+)?$",
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
app.include_router(ws_logs.router)

# ---------- SPA CATCH-ALL FALLBACK ----------
# Must be LAST — catches SPA routes (e.g., /retention, /about) when user refreshes.
# These are client-side React Router paths that don't exist in FastAPI.
# Uses the Referer header to redirect back to /service/{id}/{path}.
from fastapi import Request, HTTPException as _HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import re as _re

# Known API route prefixes — these should NEVER be caught by the SPA fallback
_API_PREFIXES = ("service/", "webhook", "projects", "logs", "env-vars", "system", "api/", "docs", "openapi")

@app.api_route("/{path:path}", methods=["GET"], include_in_schema=False)
async def spa_catch_all(path: str, request: Request):
    # Skip API-like paths — raise proper exception so CORS middleware wraps the response
    if path.startswith(_API_PREFIXES):
        raise _HTTPException(status_code=404, detail="Not found")
    
    # Only handle browser navigation requests (not XHR/fetch)
    accept = request.headers.get("accept", "")
    if "text/html" not in accept:
        raise _HTTPException(status_code=404, detail="Not found")
    
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
