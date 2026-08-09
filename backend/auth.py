"""
Deploy — Authentication
Verifies Supabase JWT tokens from the frontend.
The frontend handles GitHub OAuth login via Supabase Auth.
The backend only needs to verify the token and extract the user info.
"""
from fastapi import Request, HTTPException
from database import supabase


async def get_current_user(request: Request) -> dict:
    """
    Extract and verify the Supabase user from the Authorization header.
    
    The frontend sends: Authorization: Bearer <supabase_access_token>
    We call Supabase's auth.get_user() to verify the token and get user info.
    
    Returns the Supabase user object which contains:
      - user.id (UUID)
      - user.user_metadata.user_name (GitHub username)
      - user.user_metadata.avatar_url
      - user.email
    """
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid auth token")
    
    token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Empty auth token")
    
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token — user not found")
        return user_response.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_user_id_from_supabase(user) -> str:
    """
    Given a Supabase auth user, find or create the corresponding user in our 
    custom 'users' table and return their UUID.
    
    This bridges Supabase Auth (which has its own user IDs) with our custom
    users table (which stores github_id, username, etc.).
    """
    # The Supabase Auth user ID (UUID) is stable and constant. 
    # We MUST use this to prevent 403 errors across server restarts.
    user_id = user.id
    
    # 1. Check if user already exists in our table by ID
    user_query = supabase.table("users").select("id").eq("id", user_id).execute()
    
    if len(user_query.data) > 0:
        return user_query.data[0]["id"]
        
    # 2. Extract GitHub details from Supabase metadata
    github_username = user.user_metadata.get("user_name", "unknown")
    avatar_url = user.user_metadata.get("avatar_url", "")
    email = user.email
    
    # 3. Try to get the GitHub provider ID
    github_id_str = user.user_metadata.get("provider_id")
    if github_id_str:
        github_id = int(github_id_str)
        # Handle case where user logged in previously with old authlib flow
        existing = supabase.table("users").select("id").eq("github_id", github_id).execute()
        if len(existing.data) > 0:
            return existing.data[0]["id"]
    else:
        # Deterministic fallback (safe across restarts)
        import hashlib
        github_id = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % (10**14)
        
    # 4. Create the new user record in our DB
    new_user = {
        "id": user_id,  # Explicitly match the Supabase Auth UUID
        "github_id": github_id,
        "username": github_username,
        "email": email,
        "avatar_url": avatar_url,
    }
    
    try:
        supabase.table("users").insert(new_user).execute()
    except Exception as e:
        # In case of rare race conditions, ignore the insert error
        pass
        
    return user_id
