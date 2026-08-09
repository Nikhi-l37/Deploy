"""
Deploy — Database Connection
Initializes the Supabase client.
"""
from supabase import create_client, Client
import config

# Initialize Supabase client
if config.SUPABASE_URL and config.SUPABASE_KEY:
    supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
else:
    print("WARNING: Missing SUPABASE_URL or SUPABASE_KEY in environment.")
    supabase = None
