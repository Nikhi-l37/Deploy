"""
Deploy — Configuration
Loads all environment variables and constants.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ---------- Supabase ----------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ---------- GitHub OAuth ----------
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

# ---------- Fernet Encryption ----------
FERNET_KEY = os.getenv("FERNET_KEY")

# ---------- Redis ----------
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# ---------- Server ----------
PORT = int(os.getenv("PORT", 8000))

# ---------- Platform Limits ----------
MAX_RUNNING_CONTAINERS = int(os.getenv("MAX_RUNNING_CONTAINERS", 2))
MAX_APPS_PER_USER = int(os.getenv("MAX_APPS_PER_USER", 1))
PORT_RANGE_START = int(os.getenv("PORT_RANGE_START", 8001))
PORT_RANGE_END = int(os.getenv("PORT_RANGE_END", 8010))

# ---------- Docker Resource Limits ----------
CONTAINER_MEM_LIMIT = "128m"
CONTAINER_CPU_PERIOD = 100000
CONTAINER_CPU_QUOTA = 25000  # 25% of 1 CPU
