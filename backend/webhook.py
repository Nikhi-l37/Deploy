"""
Deploy — Webhook Handler
Receives GitHub webhook payloads, verifies their HMAC-SHA256 signature, 
checks the 1-app limit, and pushes jobs to the Redis build queue.
"""
from fastapi import APIRouter, Request, HTTPException, Header
import hmac
import hashlib
import json
import redis
import config
from database import supabase
from cryptography.fernet import Fernet
from auth import get_current_user, get_user_id_from_supabase

def normalize_github_url(url):
    """Strip .git suffix and trailing slashes for consistent comparison."""
    if url:
        url = url.rstrip('/')
        if url.endswith('.git'):
            url = url[:-4]
    return url

router = APIRouter(prefix="/webhook", tags=["Deploy Pipeline"])

# Initialize Redis client for the build queue
redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)


def verify_github_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verifies that the webhook actually came from GitHub using our secret."""
    if not signature or not secret:
        return False
    
    expected_mac = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    expected_signature = "sha256=" + expected_mac
    
    return hmac.compare_digest(expected_signature, signature)


@router.post("/")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None)
):
    # 1. Read the raw payload for signature verification
    payload = await request.body()
    
    # 2. Verify Security Signature (Reject fake requests)
    if not verify_github_signature(payload, x_hub_signature_256, config.GITHUB_WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid GitHub signature")
        
    # 3. Parse JSON data
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Only process 'push' events
    if "repository" not in data or "ref" not in data:
        return {"status": "ignored", "message": "Not a push event"}
        
    # For simplicity, we only trigger deploys on the master/main branch
    branch = data["ref"].split("/")[-1]
    if branch not in ["main", "master"]:
        return {"status": "ignored", "message": f"Ignored push to branch: {branch}"}

    github_url = data["repository"]["html_url"]
    
    # 4. Find the project in Supabase by github_url
    projects_query = supabase.table("projects").select("*").eq("github_url", normalize_github_url(github_url)).execute()
    
    if len(projects_query.data) == 0:
        return {"status": "ignored", "message": "Project not registered in Deploy"}
        
    project = projects_query.data[0]
    project_id = project["id"]
    
    # 5. Check the platform-wide active apps limit before queueing
    active_apps_query = supabase.table("projects").select("id", count="exact").in_("status", ["RUNNING", "BUILDING"]).execute()
    
    if active_apps_query.count >= config.MAX_RUNNING_CONTAINERS:
        # We update the status to FAILED and warn the user
        supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
        return {"status": "failed", "message": "Platform capacity reached. Upgrade server for more apps."}

    # 6. Update status to QUEUED
    supabase.table("projects").update({"status": "QUEUED"}).eq("id", project_id).execute()

    # 7. Push the project_id to the Redis build queue
    redis_client.rpush("build_queue", project_id)

    return {"status": "success", "message": "Deploy queued!"}


@router.post("/manual")
async def manual_deploy(request: Request):
    """Trigger a manual deploy or create a new project from the frontend dashboard.
    Requires authentication. New projects are linked to the authenticated user."""
    try:
        # Authenticate the user
        user = await get_current_user(request)
        user_id = await get_user_id_from_supabase(user)
        
        data = await request.json()
        project_id = data.get("project_id")
        github_url = data.get("github_url")
        
        if github_url:
            # Check 1-app-per-user limit
            existing = supabase.table("projects").select("id", count="exact").eq(
                "user_id", user_id
            ).neq("status", "STOPPED").neq("status", "FAILED").execute()
            
            if existing.count >= config.MAX_APPS_PER_USER:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Free plan limited to {config.MAX_APPS_PER_USER} active project(s). Delete an existing project first."
                )
            
            # Extract optional fields
            root_directory = data.get("root_directory")
            start_command = data.get("start_command")
            env_vars = data.get("env_vars")
            
            # Create new project linked to this user
            project_data = {
                "github_url": github_url,
                "user_id": user_id,
                "status": "QUEUED"
            }
            if root_directory:
                project_data["root_directory"] = root_directory
            if start_command:
                project_data["start_command"] = start_command
            
            res = supabase.table("projects").insert(project_data).execute()
            project_id = res.data[0]["id"]
            
            # Encrypt and save environment variables if provided
            if env_vars:
                f = Fernet(config.FERNET_KEY)
                for ev in env_vars:
                    if ev.get('key') and ev.get('value'):
                        encrypted = f.encrypt(ev['value'].encode()).decode()
                        supabase.table('env_vars').insert({
                            'project_id': project_id,
                            'key_name': ev['key'],
                            'value_enc': encrypted
                        }).execute()
        
        elif project_id:
            # Verify project exists AND belongs to this user
            res = supabase.table("projects").select("*").eq("id", project_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Project not found")
            
            if res.data[0].get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="You don't own this project")
            
            # Update status
            supabase.table("projects").update({"status": "QUEUED"}).eq("id", project_id).execute()
        
        else:
            raise HTTPException(status_code=400, detail="Must provide project_id or github_url")
            
        # Queue the build
        redis_client.rpush("build_queue", project_id)
        
        return {"status": "success", "message": "Manual deploy queued!"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

