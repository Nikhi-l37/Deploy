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
    res = supabase.table("projects").select("*").ilike("id", f"{clean_id}%").execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = res.data[0]
    status = project.get("status")
    port = project.get("port")
    
    if not port:
        raise HTTPException(status_code=500, detail="No port allocated for this project")
        
    real_id = project["id"]
    client_docker = docker_client
    container_name = f"deploy-{real_id[:8]}"
    
    if status == "SLEEPING":
        print(f"[Auto-Wake Proxy] Incoming request for sleeping project {project_id[:8]}. Waking container up...")
        try:
            container = client_docker.containers.get(container_name)
            container.start()
            
            # Wait for container port to be ready
            import socket
            for _ in range(15):
                await asyncio.sleep(0.5)
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(0.5)
                    result = sock.connect_ex(('127.0.0.1', port))
                    sock.close()
                    if result == 0:
                        break
                except Exception:
                    pass
            
            supabase.table("projects").update({"status": "RUNNING"}).eq("id", real_id).execute()
            redis_client.set(f"last_active:{real_id}", time.time())
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
        
        return Response(
            content=proxy_res.content,
            status_code=proxy_res.status_code,
            headers=res_headers,
            media_type=proxy_res.headers.get("content-type")
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Application is starting or port is unreachable")
    except Exception as e:
        print(f"[Auto-Wake Proxy] Exception forwarding request: {e}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


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
            client = docker_client
            container_name = f"deploy-{project_id[:8]}"
            container = client.containers.get(container_name)
            container.start()
            
            port = project.get("port", 8001)
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
            return {"status": "woken up"}
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
