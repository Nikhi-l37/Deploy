#!/bin/bash
# ============================================================
#  Deployat — Automated AWS EC2 Setup Script (t3.large)
#  Run this on a fresh Ubuntu 22.04 EC2 instance.
#
#  Usage:
#    chmod +x setup.sh
#    ./setup.sh
# ============================================================

set -e  # Exit on any error

echo ""
echo "=========================================="
echo "   🚀 Deployat AWS Deployment Script"
echo "   Server: t3.large (2 vCPU, 8GB RAM)"
echo "=========================================="
echo ""

# ---- Step 0: Collect configuration ----
read -p "Enter your domain name (e.g., deployat.me): " DOMAIN_NAME
DOMAIN_NAME=${DOMAIN_NAME:-deployat.me}

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
if [ -z "$PUBLIC_IP" ]; then
    read -p "Could not auto-detect public IP. Enter your EC2 Elastic IP: " PUBLIC_IP
fi
echo "✅ Public IP: $PUBLIC_IP"
echo "✅ Domain: $DOMAIN_NAME"

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
echo "  Step 1: Adding 1GB Swap (Safety Net)"
echo "=========================================="

if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created (8GB RAM + 1GB Swap = 9GB total)"
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

# Nginx + Certbot for SSL
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
echo "✅ Nginx + Certbot installed"

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
    git clone -b dev1 https://github.com/Nikhi-l37/Deploy.git deployly
fi
echo "✅ Repository cloned (branch: dev1)"

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

# Create .env file (t3.large optimized)
cat > .env << ENVEOF
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}
FERNET_KEY=${FERNET_KEY}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
REDIS_URL=redis://localhost:6379

# Server (port 8000 is fine on Linux — no Docker Desktop conflict)
PORT=8000

# Platform Limits (t3.large: 2 vCPU, 8GB RAM)
MAX_RUNNING_CONTAINERS=10
MAX_APPS_PER_USER=5
PORT_RANGE_START=8001
PORT_RANGE_END=8050

# URLs
API_BASE_URL=https://${DOMAIN_NAME}
HOST_URL=https://${DOMAIN_NAME}
NGINX_CONF_PATH=/etc/nginx/conf.d/deploy.conf
DOMAIN_NAME=${DOMAIN_NAME}
ENVEOF

echo "✅ Backend configured"

echo ""
echo "=========================================="
echo "  Step 5: Setting Up Frontend"
echo "=========================================="

cd /home/ubuntu/deployly/frontend

# Create frontend .env (backend URL goes through Nginx on same domain)
cat > .env << ENVEOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_BACKEND_URL=https://${DOMAIN_NAME}
ENVEOF

# Build the frontend
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

# Create Nginx site config — serves frontend + proxies ALL API routes to FastAPI
sudo tee /etc/nginx/sites-available/deployly > /dev/null << NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Serve React frontend
    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # ---- API Routes → FastAPI backend ----

    # Webhook (GitHub + manual deploy)
    location /webhook/ {
        proxy_pass http://127.0.0.1:8000/webhook/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Service proxy (deployed user apps)
    location /service/ {
        proxy_pass http://127.0.0.1:8000/service/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }

    # Projects API
    location /projects {
        proxy_pass http://127.0.0.1:8000/projects;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Gateway (container wake)
    location /gateway/ {
        proxy_pass http://127.0.0.1:8000/gateway/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Wake page
    location /wake-page/ {
        proxy_pass http://127.0.0.1:8000/wake-page/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # System endpoints (health, resources)
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    location /system/ {
        proxy_pass http://127.0.0.1:8000/system/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # WebSocket logs
    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }

    # Assets fallback
    location /assets/ {
        proxy_pass http://127.0.0.1:8000/assets/;
        proxy_set_header Host \$host;
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
Description=Deployat FastAPI Backend
After=network.target redis.service docker.service

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

# Reload systemd and start services
sudo systemctl daemon-reload
sudo systemctl enable deployly-api
sudo systemctl start deployly-api

echo "✅ Services created and started"

echo ""
echo "=========================================="
echo "  Step 8: SSL Certificate (Let's Encrypt)"
echo "=========================================="

echo ""
echo "⚠️  Make sure your domain DNS (${DOMAIN_NAME}) points to ${PUBLIC_IP} before proceeding!"
read -p "Is DNS configured? (y/n): " DNS_READY

if [ "$DNS_READY" = "y" ]; then
    sudo certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email admin@${DOMAIN_NAME} --redirect
    echo "✅ SSL certificate installed! Site is now HTTPS"
else
    echo "⏭️  Skipping SSL. Run this later:"
    echo "   sudo certbot --nginx -d ${DOMAIN_NAME} --redirect"
fi

echo ""
echo "=========================================="
echo "  Step 9: Security Group Reminder"
echo "=========================================="

echo ""
echo "  Make sure your EC2 Security Group allows:"
echo "  ┌──────────┬──────────┬───────────────────────────────────┐"
echo "  │ Port     │ Protocol │ Purpose                           │"
echo "  ├──────────┼──────────┼───────────────────────────────────┤"
echo "  │ 22       │ TCP      │ SSH access                        │"
echo "  │ 80       │ TCP      │ HTTP (Nginx → HTTPS redirect)     │"
echo "  │ 443      │ TCP      │ HTTPS (Nginx → Frontend + API)    │"
echo "  │ 8001-8050│ TCP      │ Deployed container ports          │"
echo "  └──────────┴──────────┴───────────────────────────────────┘"
echo ""

echo ""
echo "=========================================="
echo "  Step 10: Final Checks"
echo "=========================================="

echo ""
echo "Service Status:"
echo "  API:    $(sudo systemctl is-active deployly-api)"
echo "  Nginx:  $(sudo systemctl is-active nginx)"
echo "  Redis:  $(sudo systemctl is-active redis-server)"
echo "  Docker: $(sudo systemctl is-active docker)"
echo ""

echo ""
echo "=========================================="
echo "  🎉 Deployat is LIVE!"
echo "=========================================="
echo ""
echo "  Frontend:  https://${DOMAIN_NAME}"
echo "  API:       https://${DOMAIN_NAME}/health"
echo ""
echo "  ⚠️  DON'T FORGET:"
echo "  1. Update Supabase Auth → Site URL to: https://${DOMAIN_NAME}"
echo "  2. Update Supabase Auth → Redirect URLs: add https://${DOMAIN_NAME}"
echo "  3. Update GitHub OAuth App → Callback URL: https://${DOMAIN_NAME}"
echo "  4. Update GitHub Webhook URL to: https://${DOMAIN_NAME}/webhook/"
echo ""
echo "  📋 Useful Commands:"
echo "  sudo journalctl -u deployly-api -f    (API logs)"
echo "  sudo systemctl restart deployly-api   (Restart API)"
echo "  sudo certbot renew --dry-run           (Test SSL renewal)"
echo ""
