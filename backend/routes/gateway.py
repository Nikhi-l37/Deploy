"""
Deploy — Gateway & Auto-Wake Proxy Router
Provides:
1. /gateway/{project_id} -> Nginx/Internal auth request endpoint.
2. /wake-page/{project_id} -> User-facing animated wake screen.
3. /service/{project_id} -> Render-style transparent auto-wake reverse proxy.
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, Response
import docker
import asyncio
import time
import httpx
import redis
import config
from database import supabase

router = APIRouter(tags=["Gateway & Proxy"])
redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
docker_client = docker.from_env()

# ---------- RENDER-STYLE TRANSPARENT AUTO-WAKE PROXY ----------

@router.api_route("/service/{project_id}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
@router.api_route("/service/{project_id}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def render_style_proxy(project_id: str, request: Request, path: str = ""):
    """
    Render-style Reverse Proxy with Automatic Wake-on-Demand:
    If container is RUNNING -> proxies request immediately.
    If container is SLEEPING -> wakes container up in 2-3s, waits for port, and forwards the request transparently!
    """
    clean_id = project_id.replace("deploy-", "")
    # UUID columns don't support ilike — match by prefix in Python
    all_res = supabase.table("projects").select("*").execute()
    matching = [p for p in all_res.data if p["id"].startswith(clean_id)]
    if not matching:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = matching[0]
    status = project.get("status")
    port = project.get("port")
    
    if not port:
        raise HTTPException(status_code=500, detail="No port allocated for this project")
        
    real_id = project["id"]
    client_docker = docker_client
    container_name = f"deploy-{real_id[:8]}"
    
    if status == "SLEEPING":
        # For browser GET requests: show a nice wake-up animation page
        accept = request.headers.get("accept", "")
        if request.method == "GET" and "text/html" in accept:
            service_url = f"/service/{project_id}/{path}"
            if request.url.query:
                service_url += f"?{request.url.query}"
            wake_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waking Up - Deployat</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #090d16;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }}
        .card {{
            background: #111827;
            border: 1px solid #1f293d;
            border-radius: 20px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
        }}
        .spinner {{
            width: 80px; height: 80px;
            border-radius: 50%;
            border: 3px solid #1e293b;
            border-top-color: #8b5cf6;
            animation: spin 1s linear infinite;
            margin: 0 auto 28px;
        }}
        @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
        h1 {{ font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #fff; }}
        .subtitle {{ color: #64748b; font-size: 14px; margin-bottom: 28px; }}
        .status-text {{ font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #a78bfa; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="spinner"></div>
        <h1>Waking up application...</h1>
        <p class="subtitle">Your app was sleeping to save resources. Starting it now!</p>
        <p id="status" class="status-text">Booting container...</p>
    </div>
    <script>
        async function wake() {{
            try {{
                const res = await fetch('/gateway/{real_id}');
                const data = await res.json();
                if (data.status === 'woken up' || data.status === 'ok') {{
                    document.getElementById('status').textContent = 'Ready! Redirecting...';
                    setTimeout(() => window.location.href = '{service_url}', 800);
                }} else {{
                    document.getElementById('status').textContent = 'Starting up... retrying';
                    setTimeout(wake, 2000);
                }}
            }} catch (e) {{
                document.getElementById('status').textContent = 'Retrying...';
                setTimeout(wake, 2000);
            }}
        }}
        wake();
    </script>
</body>
</html>"""
            return HTMLResponse(content=wake_html)

        # For API calls: blocking wake (wait for container to be ready)
        print(f"[Auto-Wake Proxy] Incoming API request for sleeping project {project_id[:8]}. Waking container up...")
        try:
            # Try to start the existing container
            try:
                container = client_docker.containers.get(container_name)
                container.start()
                try:
                    container.update(restart_policy={"Name": "unless-stopped"})
                except Exception:
                    pass
            except docker.errors.NotFound:
                # Container was removed - recreate from image
                print(f"[Auto-Wake Proxy] Container {container_name} missing. Recreating...")
                image_name = f"{container_name}:latest"
                try:
                    client_docker.images.get(image_name)
                except docker.errors.ImageNotFound:
                    raise HTTPException(status_code=502, detail="Container and image were lost. Please redeploy.")
                
                from builder import decrypt_env_vars
                env_vars = decrypt_env_vars(real_id)
                if "PORT" not in env_vars:
                    env_vars["PORT"] = "8080"
                
                import config as cfg
                try:
                    client_docker.networks.get(cfg.DOCKER_NETWORK)
                except docker.errors.NotFound:
                    client_docker.networks.create(cfg.DOCKER_NETWORK, driver="bridge")
                
                container = client_docker.containers.run(
                    image=image_name, detach=True,
                    ports={f"{env_vars['PORT']}/tcp": port},
                    environment=env_vars,
                    mem_limit=cfg.CONTAINER_MEM_LIMIT_FRONTEND if project.get("project_type") == "frontend" else cfg.CONTAINER_MEM_LIMIT_BACKEND,
                    cpu_period=cfg.CONTAINER_CPU_PERIOD, cpu_quota=cfg.CONTAINER_CPU_QUOTA,
                    name=container_name, network=cfg.DOCKER_NETWORK,
                    restart_policy={"Name": "unless-stopped"}
                )
                supabase.table("projects").update({"container_id": container.id}).eq("id", real_id).execute()
                print(f"[Auto-Wake Proxy] Recreated container {container_name}")
            
            # Wait for the app to actually respond (not just TCP port open)
            app_ready = False
            for attempt in range(20):  # Up to 20 * 0.5s = 10 seconds
                await asyncio.sleep(0.5)
                try:
                    async with httpx.AsyncClient(timeout=2.0) as check_client:
                        health_res = await check_client.get(f"http://127.0.0.1:{port}/")
                        app_ready = True
                        break
                except Exception:
                    pass
            
            if not app_ready:
                print(f"[Auto-Wake Proxy] Container started but app not responding after 10s")
            
            supabase.table("projects").update({"status": "RUNNING"}).eq("id", real_id).execute()
            redis_client.set(f"last_active:{real_id}", time.time())
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Auto-Wake Proxy] Failed to wake container: {e}")
            raise HTTPException(status_code=502, detail=f"Failed to auto-wake application: {str(e)}")
            
    # Forward the HTTP request to the container
    target_url = f"http://127.0.0.1:{port}/{path}"
    if request.url.query:
        target_url += f"?{request.url.query}"
        
    body = await request.body()
    excluded_headers = {"host", "content-length", "accept-encoding", "connection"}
    forward_headers = {k: v for k, v in request.headers.items() if k.lower() not in excluded_headers}
    
    # Retry the proxy request (container may still be warming up)
    base_prefix = f"/service/{project_id}"
    last_error = None
    for retry in range(3):
        try:
            async with httpx.AsyncClient(timeout=20.0) as http_client:
                proxy_res = await http_client.request(
                    method=request.method,
                    url=target_url,
                    headers=forward_headers,
                    content=body if body else None,
                    follow_redirects=False
                )
            redis_client.set(f"last_active:{real_id}", time.time())
            
            res_headers = {}
            for k, v in proxy_res.headers.items():
                if k.lower() not in {"content-encoding", "transfer-encoding", "content-length"}:
                    res_headers[k] = v
            
            content = proxy_res.content
            content_type = proxy_res.headers.get("content-type", "")
            content_encoding = proxy_res.headers.get("content-encoding", "")
            
            # Rewrite HTML responses: prefix absolute paths with /service/{id}
            # so /assets/index.js becomes /service/{id}/assets/index.js
            if "text/html" in content_type:
                # Decompress if needed (container might gzip even without accept-encoding)
                raw = content
                if content_encoding == "gzip":
                    import gzip
                    try:
                        raw = gzip.decompress(content)
                    except Exception:
                        pass
                elif content_encoding == "br":
                    try:
                        import brotli
                        raw = brotli.decompress(content)
                    except Exception:
                        pass
                
                html = raw.decode("utf-8", errors="replace")
                print(f"[Service Proxy] Rewriting HTML for {project_id} (len={len(html)}, encoding={content_encoding})")
                
                # Replace absolute paths in HTML attributes (both quote styles)
                for attr in ['src="/', 'href="/', 'action="/']:
                    html = html.replace(attr, attr[:-1] + base_prefix + '/')
                for attr in ["src='/", "href='/", "action='/"]:
                    html = html.replace(attr, attr[:-1] + base_prefix + '/')
                # Fix protocol-relative URLs we accidentally rewrote
                html = html.replace(f'{base_prefix}//', '//')
                
                content = html.encode("utf-8")
                # Remove content-encoding since we decompressed
                res_headers.pop("content-encoding", None)
            
            # Prevent browser from caching proxied HTML (causes stale pages when sleeping)
            if "text/html" in content_type:
                res_headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                res_headers["Pragma"] = "no-cache"
            else:
                print(f"[Service Proxy] Non-HTML response for {project_id}/{path}: {content_type}")
            
            return Response(
                content=content,
                status_code=proxy_res.status_code,
                headers=res_headers,
                media_type=content_type
            )
        except httpx.ConnectError as e:
            last_error = e
            await asyncio.sleep(1)  # Wait 1s before retry
        except Exception as e:
            print(f"[Auto-Wake Proxy] Exception forwarding request: {e}")
            raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")
    
    raise HTTPException(status_code=502, detail="Application is starting or port is unreachable. Try again in a few seconds.")


# ---------- ASSET FALLBACK (catches /assets/* requests without /service/ prefix) ----------

@router.get("/assets/{path:path}")
@router.get("/vite.svg")
@router.get("/favicon.ico")
async def asset_fallback(request: Request, path: str = ""):
    """Catches asset requests that browsers make with absolute paths.
    Uses the Referer header to determine which project to proxy to.
    
    Example: Browser loads /service/3dc9d5d8/, HTML has <script src="/assets/index.js">
    Browser requests /assets/index.js (without /service/ prefix).
    We check Referer: http://localhost:8000/service/3dc9d5d8/ -> redirect to /service/3dc9d5d8/assets/index.js
    """
    import re as re_mod
    from fastapi.responses import RedirectResponse
    
    referer = request.headers.get("referer", "")
    match = re_mod.search(r'/service/([a-f0-9-]+)', referer)
    
    if match:
        project_short_id = match.group(1)
        # Reconstruct the full path
        full_path = request.url.path
        redirect_url = f"/service/{project_short_id}{full_path}"
        if request.url.query:
            redirect_url += f"?{request.url.query}"
        print(f"[Asset Fallback] Redirecting {full_path} -> {redirect_url}")
        return RedirectResponse(url=redirect_url, status_code=307)
    
    raise HTTPException(status_code=404, detail="Not found")


# ---------- GATEWAY & WAKE SCREEN ----------

@router.get("/gateway/{project_id}")
async def gateway(project_id: str):
    """Checks container status and wakes it up if sleeping."""
    res = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = res.data[0]
    status = project["status"]
    
    if status == "RUNNING":
        redis_client.set(f"last_active:{project_id}", time.time())
        return {"status": "ok"}
        
    elif status == "SLEEPING":
        try:
            container_name = f"deploy-{project_id[:8]}"
            port = project.get("port", 8001)
            
            # Try to start the existing container
            try:
                container = docker_client.containers.get(container_name)
                container.start()
                # Restore restart policy AFTER starting
                try:
                    container.update(restart_policy={"Name": "unless-stopped"})
                except Exception:
                    pass
            except docker.errors.NotFound:
                # Container was removed (Docker restart, prune, etc.)
                # Recreate it from the existing image
                print(f"[Gateway] Container {container_name} not found. Recreating from image...")
                image_name = f"{container_name}:latest"
                
                # Check if image still exists
                try:
                    docker_client.images.get(image_name)
                except docker.errors.ImageNotFound:
                    # Image is also gone — must rebuild
                    supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
                    raise HTTPException(
                        status_code=500, 
                        detail="Container and image were lost. Please redeploy from the dashboard."
                    )
                
                # Decrypt env vars for the container
                from builder import decrypt_env_vars
                env_vars = decrypt_env_vars(project_id)
                if "PORT" not in env_vars:
                    env_vars["PORT"] = "8080"
                
                container_port = env_vars["PORT"]
                
                # Ensure Docker network exists
                import config as cfg
                try:
                    docker_client.networks.get(cfg.DOCKER_NETWORK)
                except docker.errors.NotFound:
                    docker_client.networks.create(cfg.DOCKER_NETWORK, driver="bridge")
                
                # Recreate the container
                container = docker_client.containers.run(
                    image=image_name,
                    detach=True,
                    ports={f"{container_port}/tcp": port},
                    environment=env_vars,
                    mem_limit=cfg.CONTAINER_MEM_LIMIT_FRONTEND if project.get("project_type") == "frontend" else cfg.CONTAINER_MEM_LIMIT_BACKEND,
                    cpu_period=cfg.CONTAINER_CPU_PERIOD,
                    cpu_quota=cfg.CONTAINER_CPU_QUOTA,
                    name=container_name,
                    network=cfg.DOCKER_NETWORK,
                    restart_policy={"Name": "unless-stopped"}
                )
                
                # Update container_id in DB
                supabase.table("projects").update({"container_id": container.id}).eq("id", project_id).execute()
                print(f"[Gateway] Recreated container {container_name}")
            
            # Wait for port to be ready
            import socket
            for _ in range(10):
                await asyncio.sleep(1)
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex(('127.0.0.1', port))
                    sock.close()
                    if result == 0:
                        break
                except Exception:
                    pass
            
            supabase.table("projects").update({"status": "RUNNING"}).eq("id", project_id).execute()
            redis_client.set(f"last_active:{project_id}", time.time())
            
            # Render-style: if this is a frontend, also wake its linked backend
            if project.get("project_type") == "frontend":
                await _wake_linked_backend(project)
            
            return {"status": "woken up"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Gateway error waking container: {e}")
            supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
            raise HTTPException(status_code=500, detail=f"Failed to wake container: {str(e)}")
            
    else:
        return {"status": status}


@router.get("/wake-page/{project_id}", response_class=HTMLResponse)
async def wake_page(project_id: str):
    """Renders the dark-themed animated wake page for sleeping containers."""
    res = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = res.data[0]
    subdomain = project.get("subdomain", "")
    port = project.get("port", 8001)
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Waking Up — Deployat</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background-color: #090d16;
                color: #e2e8f0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 24px;
            }}
            .card {{
                background: #111827;
                border: 1px solid #1f293d;
                border-radius: 20px;
                padding: 48px 40px;
                max-width: 480px;
                width: 100%;
                text-align: center;
                box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
            }}
            .spinner-container {{
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 28px;
            }}
            .spinner {{
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 3px solid #1e293b;
                border-top-color: #8b5cf6;
                animation: spin 1s linear infinite;
            }}
            @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
            h1 {{ font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #fff; }}
            .subtitle {{ color: #64748b; font-size: 14px; margin-bottom: 28px; }}
            .status-text {{ font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #a78bfa; margin-bottom: 24px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="spinner-container">
                <div class="spinner"></div>
            </div>
            <h1>Waking up application...</h1>
            <p class="subtitle">Deployat is spinning up the sandbox container</p>
            <p id="status-text" class="status-text">Booting container...</p>
        </div>
        <script>
            async function wake() {{
                try {{
                    const res = await fetch('/gateway/{project_id}');
                    const data = await res.json();
                    if (data.status === 'woken up' || data.status === 'ok') {{
                        document.getElementById('status-text').textContent = 'Ready! Redirecting...';
                        setTimeout(() => {{
                            const isIp = /^(\\d{{1,3}}\\.){{3}}\\d{{1,3}}$/.test(window.location.hostname);
                            if (window.location.hostname === 'localhost' || isIp) {{
                                window.location.href = window.location.protocol + '//' + window.location.hostname + ':{port}';
                            }} else {{
                                window.location.href = window.location.protocol + '//{subdomain}.' + window.location.hostname.replace(/^www\\./, '');
                            }}
                        }}, 1000);
                    }}
                }} catch (e) {{
                    document.getElementById('status-text').textContent = 'Failed to wake application.';
                }}
            }}
            wake();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


async def _wake_linked_backend(frontend_project: dict):
    """When a frontend wakes up, also wake its linked backend (Render-style).
    Finds the backend from the same user + same repo and starts its container."""
    try:
        user_id = frontend_project.get("user_id")
        github_url = frontend_project.get("github_url")
        if not user_id or not github_url:
            return
        
        # Find the linked backend
        siblings = supabase.table("projects").select("*").eq(
            "user_id", user_id
        ).eq("github_url", github_url).eq(
            "project_type", "backend"
        ).eq("status", "SLEEPING").execute()
        
        if not siblings.data:
            return
        
        backend = siblings.data[0]
        backend_id = backend["id"]
        container_name = f"deploy-{backend_id[:8]}"
        backend_port = backend.get("port")
        
        print(f"[Gateway] Waking linked backend {container_name} for fullstack project")
        
        # Start the backend container
        try:
            container = docker_client.containers.get(container_name)
            container.start()
            try:
                container.update(restart_policy={"Name": "unless-stopped"})
            except Exception:
                pass
        except docker.errors.NotFound:
            # Container was removed — try to recreate from image
            image_name = f"{container_name}:latest"
            try:
                docker_client.images.get(image_name)
            except docker.errors.ImageNotFound:
                print(f"[Gateway] Backend image {image_name} not found. Cannot auto-wake.")
                return
            
            from builder import decrypt_env_vars
            import config as cfg
            env_vars = decrypt_env_vars(backend_id)
            if "PORT" not in env_vars:
                env_vars["PORT"] = "8080"
            
            container_port = env_vars["PORT"]
            try:
                docker_client.networks.get(cfg.DOCKER_NETWORK)
            except docker.errors.NotFound:
                docker_client.networks.create(cfg.DOCKER_NETWORK, driver="bridge")
            
            container = docker_client.containers.run(
                image=image_name,
                detach=True,
                ports={f"{container_port}/tcp": backend_port},
                environment=env_vars,
                mem_limit=cfg.CONTAINER_MEM_LIMIT_BACKEND,
                cpu_period=cfg.CONTAINER_CPU_PERIOD,
                cpu_quota=cfg.CONTAINER_CPU_QUOTA,
                name=container_name,
                network=cfg.DOCKER_NETWORK,
                restart_policy={"Name": "unless-stopped"}
            )
            supabase.table("projects").update({"container_id": container.id}).eq("id", backend_id).execute()
        
        # Wait for backend port to be ready
        if backend_port:
            import socket
            for _ in range(10):
                await asyncio.sleep(1)
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex(('127.0.0.1', backend_port))
                    sock.close()
                    if result == 0:
                        break
                except Exception:
                    pass
        
        supabase.table("projects").update({"status": "RUNNING"}).eq("id", backend_id).execute()
        redis_client.set(f"last_active:{backend_id}", time.time())
        print(f"[Gateway] Linked backend {container_name} is now RUNNING")
    except Exception as e:
        print(f"[Gateway] Error waking linked backend: {e}")
