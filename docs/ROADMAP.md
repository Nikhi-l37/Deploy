# Deployly Roadmap

## Phase 1: Local Prototype (COMPLETED ✅)

- [x] GitHub OAuth login via Supabase.
- [x] Project CRUD (Create, Read, Delete) operations.
- [x] Complete deployment pipeline (clone -> build -> run).
- [x] Auto language detection for Python and Node.js.
- [x] Auto-generation of `Dockerfile` based on repository contents.
- [x] Docker build execution with log streaming to UI via Redis Pub/Sub.
- [x] Fernet-encrypted environment variables at rest.
- [x] Container health check after spin up.
- [x] Nginx reverse proxy configuration generation.
- [x] Live container runtime log viewing.
- [x] Dark-themed, responsive React dashboard with tabbed detailed views (Logs, Env, Settings).
- [x] Dynamic platform resource limits enforced per container (Memory: 128m, CPU: 25%).

## Phase 2A: AWS Migration

To move the platform from local testing to a cloud environment:
1. **Provision Infrastructure**: Launch a `t2.micro` EC2 instance (1 vCPU, 1 GB RAM — free tier eligible).
2. **System Prep**: Add a 2GB swap file on disk. Swap is NOT extra RAM — it uses hard disk space as overflow memory. When Docker builds spike past 1GB RAM, the OS spills into swap instead of crashing. Effective memory: 1 GB RAM + 2 GB Swap = 3 GB total.
3. **Install Dependencies**: Install Docker, Redis, Python, Nginx, and Git on the server.
4. **Deploy Backend**: Run the FastAPI application and the Builder worker as `systemd` background services.
5. **Deploy Frontend**: Host the React app using Vercel, AWS Amplify, or statically serve it from the same EC2 instance.
6. **Security Configuration**: Set AWS Security Group rules to allow incoming traffic on ports `80` (HTTP), `443` (HTTPS), `8000` (API), and optionally `8001-8010` (container direct access).
7. **Webhook Integration**: Point GitHub webhooks from ngrok to the new EC2 public IP.

## Phase 2B: Frontend App Hosting (Multi-Stage Docker Builds)

Expand platform capabilities to support frontend frameworks:
- **Framework Detection**: Detect frontend apps by checking for files like `vite.config.js`, `next.config.js`, or `package.json` with React/Vue dependencies.
- **Docker Multi-Stage Strategy**: Generate multi-stage Dockerfiles that first build the static files (e.g., `node build`), and then use a lightweight Nginx alpine image to serve them.
- **Benefits**: Ensures the runtime container remains incredibly small (~5MB), leveraging the same deployment pipeline without needing new AWS services (like S3/CloudFront).

## Phase 2C: Production Polish

Improve the system for real-world reliability:
- **Advanced Nginx Routing**: Perfect subdomain routing to map container IPs smoothly.
- **SSL/TLS**: Implement automatic HTTPS provisioning via Let's Encrypt and Certbot for all hosted subdomains.
- **Custom Domains**: Allow users to bind custom domain names to their apps.

## Future Scope (Thesis Documentation)

*(Note: Documented as future architecture, not currently implemented)*

- **Static Asset Offloading**: Using S3 + CloudFront to serve static websites for faster global CDN delivery.
- **Serverless Builds**: Offloading the intensive Docker build process to AWS CodeBuild to prevent the main EC2 instance from CPU throttling.
- **Observability**: Integrating AWS CloudWatch for better platform monitoring and alerting.
- **Multi-Region Support**: Deploying worker nodes across different geographical regions for closer edge proximity to users.
