import hmac
import hashlib
import json
import requests
import uuid
import config
from database import supabase

print("1. Creating dummy project in Supabase...")

# Check if user exists, if not create a dummy user
users = supabase.table("users").select("*").limit(1).execute()
if not users.data:
    print("No users found. Please login via GitHub first!")
    exit(1)

user_id = users.data[0]["id"]

# We will use a tiny public Node.js Express repository for the test
github_url = "https://github.com/heroku/node-js-getting-started"

# Check if project already exists to avoid duplicates
projects = supabase.table("projects").select("*").eq("github_url", github_url).execute()
if projects.data:
    project_id = projects.data[0]["id"]
    print(f"Project already exists: {project_id}")
    # Reset status
    supabase.table("projects").update({"status": "STOPPED"}).eq("id", project_id).execute()
else:
    res = supabase.table("projects").insert({
        "user_id": user_id,
        "github_url": github_url,
        "status": "STOPPED"
    }).execute()
    project_id = res.data[0]["id"]
    print(f"Created project: {project_id}")

print("\n2. Crafting fake GitHub webhook payload...")
payload_dict = {
    "ref": "refs/heads/main",
    "repository": {
        "html_url": github_url
    }
}
payload_bytes = json.dumps(payload_dict).encode("utf-8")

# Generate the HMAC SHA-256 signature just like GitHub does
secret = config.GITHUB_WEBHOOK_SECRET
mac = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
signature = f"sha256={mac}"

print("\n3. Sending Webhook to localhost:8000/webhook/ ...")
headers = {
    "Content-Type": "application/json",
    "X-Hub-Signature-256": signature
}

response = requests.post("http://localhost:8000/webhook/", data=payload_bytes, headers=headers)
print(f"API Response [{response.status_code}]: {response.json()}")
