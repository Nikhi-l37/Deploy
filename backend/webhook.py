"""
Deploy — Webhook Handler
Receives GitHub webhook payloads, verifies their HMAC-SHA256 signature, 
checks the 1-app limit, and pushes jobs to the Redis build queue.
"""
from fastapi import APIRouter, Request, HTTPException, Header
from slowapi import Limiter
from slowapi.util import get_remote_address
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

# Rate limiter (uses app.state.limiter set in main.py)
limiter = Limiter(key_func=get_remote_address, storage_uri=config.REDIS_URL)


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
@limiter.limit("10/minute")
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
        
    # Extract branch name (handle refs/heads/release/v1 → release/v1)
    ref = data["ref"]
    branch = ref.replace("refs/heads/", "") if ref.startswith("refs/heads/") else ref.split("/")[-1]
    allowed_branches = ["main", "master", "develop", "staging"]
    if branch not in allowed_branches:
        return {"status": "ignored", "message": f"Ignored push to branch: {branch}"}

    github_url = data["repository"]["html_url"]
    
    # 4. Find the project in Supabase by github_url
    projects_query = supabase.table("projects").select("*").eq("github_url", normalize_github_url(github_url)).execute()
    
    if len(projects_query.data) == 0:
        return {"status": "ignored", "message": "Project not registered in Deploy"}
    
    # Deploy ALL projects from this repo (e.g., both frontend and backend from same repo)
    queued_ids = []
    for project in projects_query.data:
        project_id = project["id"]
        
        # 5. Check the platform-wide active apps limit before queueing
        # Exclude the current project from the count (it's already active, we're just redeploying)
        active_apps_query = supabase.table("projects").select("id", count="exact").in_("status", ["RUNNING", "BUILDING", "SLEEPING"]).neq("id", project_id).execute()
        
        if active_apps_query.count >= config.MAX_RUNNING_CONTAINERS:
            supabase.table("projects").update({"status": "FAILED"}).eq("id", project_id).execute()
            continue

        # 6. Update status to QUEUED
        supabase.table("projects").update({"status": "QUEUED"}).eq("id", project_id).execute()

        # 7. Push the project_id to the Redis build queue
        redis_client.rpush("build_queue", project_id)
        queued_ids.append(project_id[:8])

    if not queued_ids:
        return {"status": "failed", "message": "Platform capacity reached for all projects."}
    
    return {"status": "success", "message": f"Deploy queued for {len(queued_ids)} project(s): {', '.join(queued_ids)}"}


@router.post("/manual")
@limiter.limit("5/minute")
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
            github_url = normalize_github_url(github_url)
        
        if github_url:
            # Check app limit and project type combinations
            existing = supabase.table("projects").select("id, project_type", count="exact").eq(
                "user_id", user_id
            ).neq("status", "STOPPED").neq("status", "FAILED").execute()
            
            if existing.count >= config.MAX_APPS_PER_USER:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Free plan limited to {config.MAX_APPS_PER_USER} active project(s). Delete an existing project first."
                )
            
            # Validate project type combinations
            existing_types = [p.get("project_type", "backend") for p in existing.data]
            project_type = data.get("project_type", "backend")
            
            if existing.count == 1:
                existing_type = existing_types[0]
                existing_url = existing.data[0].get("github_url", "")
                if existing_type == "fullstack":
                    raise HTTPException(
                        status_code=403,
                        detail="Your fullstack project uses both app slots. Delete it first to deploy a new project."
                    )
                if project_type == "fullstack":
                    raise HTTPException(
                        status_code=403,
                        detail=f"Cannot deploy fullstack — you already have a {existing_type} project. Delete it first, or deploy a {'frontend' if existing_type == 'backend' else 'backend'} instead."
                    )
                # Allow complementary types (backend + frontend)
                # Block duplicate types
                if project_type == existing_type:
                    other_type = 'frontend' if existing_type == 'backend' else 'backend'
                    raise HTTPException(
                        status_code=403,
                        detail=f"You already have a {existing_type} project. You can deploy a {other_type} instead."
                    )
            
            # Extract optional fields
            root_directory = data.get("root_directory")
            start_command = data.get("start_command")
            env_vars = data.get("env_vars")
            
            # Auto-generate subdomain from repo name
            import re
            repo_name = github_url.rstrip('/').split('/')[-1]
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            subdomain = re.sub(r'[^a-z0-9-]', '-', repo_name.lower()).strip('-')[:30]

            # Ensure uniqueness
            subdomain_check = supabase.table('projects').select('subdomain').eq('subdomain', subdomain).execute()
            if subdomain_check.data:
                import uuid
                subdomain = f"{subdomain}-{str(uuid.uuid4())[:4]}"

            # Create new project linked to this user
            project_data = {
                "github_url": github_url,
                "user_id": user_id,
                "status": "QUEUED",
                "subdomain": subdomain,
                "project_type": project_type,
                "name": repo_name
            }
            if root_directory:
                project_data["root_directory"] = root_directory
            if start_command:
                project_data["start_command"] = start_command
            
            try:
                res = supabase.table("projects").insert(project_data).execute()
            except Exception as insert_err:
                if "project_type" in str(insert_err):
                    project_data.pop("project_type", None)
                    res = supabase.table("projects").insert(project_data).execute()
                else:
                    raise insert_err
            if not res.data:
                raise HTTPException(status_code=500, detail="Failed to create project in database")
            project_id = res.data[0]["id"]
            
            # Encrypt and save environment variables if provided
            if env_vars:
                f = Fernet(config.FERNET_KEY)
                inserts = []
                if isinstance(env_vars, list):
                    for ev in env_vars:
                        k = ev.get('key', '').strip() if isinstance(ev, dict) else ''
                        v = ev.get('value', '').strip() if isinstance(ev, dict) else ''
                        if k and v:
                            encrypted = f.encrypt(v.encode()).decode()
                            inserts.append({
                                'project_id': project_id,
                                'key_name': k,
                                'value_enc': encrypted
                            })
                elif isinstance(env_vars, dict):
                    for k, v in env_vars.items():
                        k_clean = str(k).strip()
                        v_clean = str(v).strip()
                        if k_clean and v_clean:
                            encrypted = f.encrypt(v_clean.encode()).decode()
                            inserts.append({
                                'project_id': project_id,
                                'key_name': k_clean,
                                'value_enc': encrypted
                            })
                if inserts:
                    supabase.table('env_vars').insert(inserts).execute()
        
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

