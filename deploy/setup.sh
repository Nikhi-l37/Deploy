#!/bin/bash
# ============================================================
#  Deployly — Automated AWS EC2 Setup Script
#  Run this on a fresh Ubuntu 22.04 t2.micro EC2 instance.
#
#  Usage:
#    chmod +x setup.sh
#    ./setup.sh
# ============================================================

set -e  # Exit on any error

echo ""
echo "=========================================="
echo "   🚀 Deployly AWS Deployment Script"
echo "=========================================="
echo ""

# ---- Step 0: Collect configuration ----
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
if [ -z "$PUBLIC_IP" ]; then
    read -p "Could not auto-detect public IP. Enter your EC2 Elastic IP: " PUBLIC_IP
fi
echo "✅ Public IP: $PUBLIC_IP"

# Ask for backend .env values
echo ""
echo "--- Backend Environment Variables ---"
echo "(These are from your local D:\\Deploy\\backend\\.env)"
echo ""
read -p "SUPABASE_URL: " SUPABASE_URL
read -p "SUPABASE_KEY: " SUPABASE_KEY
read -p "FERNET_KEY: " FERNET_KEY
read -p "GITHUB_CLIENT_ID: " GITHUB_CLIENT_ID
read -p "GITHUB_CLIENT_SECRET: " GITHUB_CLIENT_SECRET
read -p "GITHUB_WEBHOOK_SECRET: " GITHUB_WEBHOOK_SECRET

# Frontend env
echo ""
echo "--- Frontend Environment Variables ---"
read -p "VITE_SUPABASE_URL: " VITE_SUPABASE_URL
read -p "VITE_SUPABASE_ANON_KEY: " VITE_SUPABASE_ANON_KEY

echo ""
echo "=========================================="
echo "  Step 1: Adding 2GB Swap Space"
echo "=========================================="

if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created (1GB RAM + 2GB Swap = 3GB total)"
else
    echo "✅ Swap already exists, skipping."
fi

echo ""
echo "=========================================="
echo "  Step 2: Installing Dependencies"
echo "=========================================="

sudo apt update && sudo apt upgrade -y

# Docker
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
echo "✅ Docker installed"

# Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
echo "✅ Redis installed"

# Python
sudo apt install -y python3 python3-pip python3-venv
echo "✅ Python installed"

# Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
echo "✅ Nginx installed"

# Git
sudo apt install -y git
echo "✅ Git installed"

# Node.js 18
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "✅ Node.js $(node --version) installed"

echo ""
echo "=========================================="
echo "  Step 3: Cloning Repository"
echo "=========================================="

cd /home/ubuntu
if [ -d "deployly" ]; then
    echo "Directory exists. Pulling latest..."
    cd deployly && git pull && cd ..
else
    git clone https://github.com/Nikhi-l37/Deploy.git deployly
fi
echo "✅ Repository cloned"

echo ""
echo "=========================================="
echo "  Step 4: Setting Up Backend"
echo "=========================================="

cd /home/ubuntu/deployly/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Create .env file
cat > .env << ENVEOF
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}
FERNET_KEY=${FERNET_KEY}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
REDIS_URL=redis://localhost:6379
PORT=8000
MAX_RUNNING_CONTAINERS=2
MAX_APPS_PER_USER=1
PORT_RANGE_START=8001
PORT_RANGE_END=8010
ENVEOF

echo "✅ Backend configured"

# Update nginx_config.py for production
sed -i 's|NGINX_CONF_PATH = os.path.join(os.path.dirname(__file__), "nginx", "deploy.conf")|NGINX_CONF_PATH = "/etc/nginx/conf.d/deploy.conf"|' nginx_config.py
sed -i 's|\[MOCK\] os.system.*|Reloading Nginx..."); os.system("sudo systemctl reload nginx")|' nginx_config.py

echo "✅ nginx_config.py updated for production"

echo ""
echo "=========================================="
echo "  Step 5: Setting Up Frontend"
echo "=========================================="

cd /home/ubuntu/deployly/frontend

# Create frontend .env
cat > .env << ENVEOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENVEOF

# Update BACKEND_URL to use the EC2 public IP
sed -i "s|const BACKEND_URL = 'http://localhost:8000'|const BACKEND_URL = 'http://${PUBLIC_IP}:8000'|" src/pages/Dashboard.jsx

# Update wake-up page URLs in main.py
cd /home/ubuntu/deployly/backend
sed -i "s|http://localhost:8000/gateway/|http://${PUBLIC_IP}:8000/gateway/|g" main.py
sed -i "s|http://localhost:8000/wake-page/|http://${PUBLIC_IP}:8000/wake-page/|g" main.py

# Build the frontend
cd /home/ubuntu/deployly/frontend
npm install
npm run build

# Copy to Nginx web root
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

echo "✅ Frontend built and deployed"

echo ""
echo "=========================================="
echo "  Step 6: Configuring Nginx"
echo "=========================================="

# Create Nginx site config for Deployly
sudo tee /etc/nginx/sites-available/deployly > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;

    # Serve React frontend
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to FastAPI backend
    location /webhook/ {
        proxy_pass http://127.0.0.1:8000/webhook/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /gateway/ {
        proxy_pass http://127.0.0.1:8000/gateway/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /wake-page/ {
        proxy_pass http://127.0.0.1:8000/wake-page/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINXEOF

# Enable the site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/deployly /etc/nginx/sites-enabled/deployly

# Create empty deploy.conf for dynamic container routing
sudo touch /etc/nginx/conf.d/deploy.conf

# Allow ubuntu user to reload nginx without password
echo "ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/deployly-nginx

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx configured"

echo ""
echo "=========================================="
echo "  Step 7: Creating Systemd Services"
echo "=========================================="

# FastAPI service
sudo tee /etc/systemd/system/deployly-api.service > /dev/null << 'SVCEOF'
[Unit]
Description=Deployly FastAPI Backend
After=network.target redis.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/deployly/backend
ExecStart=/home/ubuntu/deployly/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

# Builder Worker service
sudo tee /etc/systemd/system/deployly-worker.service > /dev/null << 'SVCEOF'
[Unit]
Description=Deployly Builder Worker
After=network.target redis.service docker.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/deployly/backend
ExecStart=/home/ubuntu/deployly/backend/venv/bin/python builder.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

# Reload systemd and start services
sudo systemctl daemon-reload
sudo systemctl enable deployly-api deployly-worker
sudo systemctl start deployly-api deployly-worker

echo "✅ Services created and started"

echo ""
echo "=========================================="
echo "  Step 8: Final Checks"
echo "=========================================="

echo ""
echo "Service Status:"
echo "  API:    $(sudo systemctl is-active deployly-api)"
echo "  Worker: $(sudo systemctl is-active deployly-worker)"
echo "  Nginx:  $(sudo systemctl is-active nginx)"
echo "  Redis:  $(sudo systemctl is-active redis-server)"
echo "  Docker: $(sudo systemctl is-active docker)"
echo ""

echo ""
echo "=========================================="
echo "  🎉 Deployly is LIVE!"
echo "=========================================="
echo ""
echo "  Frontend:  http://${PUBLIC_IP}"
echo "  API:       http://${PUBLIC_IP}:8000"
echo "  Health:    http://${PUBLIC_IP}:8000/health"
echo ""
echo "  ⚠️  DON'T FORGET:"
echo "  1. Update Supabase Auth → Site URL to: http://${PUBLIC_IP}"
echo "  2. Update Supabase Auth → Redirect URLs: add http://${PUBLIC_IP}"
echo "  3. Update GitHub Webhook URL to: http://${PUBLIC_IP}:8000/webhook/"
echo ""
echo "  📋 Useful Commands:"
echo "  sudo journalctl -u deployly-api -f    (API logs)"
echo "  sudo journalctl -u deployly-worker -f (Worker logs)"
echo "  sudo systemctl restart deployly-api   (Restart API)"
echo "  sudo systemctl restart deployly-worker (Restart Worker)"
echo ""
