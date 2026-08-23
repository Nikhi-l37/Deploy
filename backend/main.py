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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=True)
