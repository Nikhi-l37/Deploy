# Deployly Architecture

## 1. Project Overview
Deployly is a mini self-hosted Platform-as-a-Service (PaaS) that enables developers to deploy backend projects with a single click. It automates cloning repositories, detecting languages, generating Dockerfiles, building images, and running containers, all while providing a real-time web dashboard to manage projects, view build logs, and securely configure environment variables.

## 2. Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React + Vite + TailwindCSS | Provides a fast, dark-themed UI for dashboard and project management. |
| **Backend** | Python FastAPI | Core API to handle webhooks, projects, and trigger deployment workflows. |
| **Authentication** | Supabase Auth | Handles user login via GitHub OAuth. |
| **Database** | Supabase PostgreSQL DB | Stores users, projects, environment variables, logs, and port registry. |
| **Worker / Containerization** | Python Docker SDK | Interacts with Docker daemon to build images and run containers dynamically. |
| **Security** | Fernet Encryption | Encrypts environment variables symmetrically before saving them to the database. |
| **Queue / Events** | Redis | Uses `blpop` for the deployment job queue and Pub/Sub for real-time log streaming. |
| **Webhooks** | GitHub Webhooks | Receives repository push events, verified securely with HMAC-SHA256 signatures. |
| **Routing** | Nginx | Reverse proxy that dynamically routes traffic to running containers based on subdomains. |
| **Networking** | ngrok | Used for local testing to expose webhooks to GitHub. |

## 3. Architecture Diagram

```mermaid
flowchart TD
    User([User]) -->|GitHub OAuth| Frontend
    User -->|Views / Manages| Frontend
    GitHub([GitHub]) -->|Webhooks on push| BackendAPI

    subgraph Frontend [Frontend App (React)]
        UI[Dashboard / Login]
    end

    subgraph BackendSystem [Backend System (FastAPI + Worker)]
        BackendAPI[FastAPI Server]
        Builder[Builder Worker]
    end

    subgraph DataStore [Data Layer]
        DB[(Supabase DB)]
        RedisQueue[(Redis)]
    end

    subgraph Infra [Infrastructure]
        Docker[Docker Engine]
        Nginx[Nginx Reverse Proxy]
    end

    Frontend <-->|API Calls| BackendAPI
    BackendAPI -->|Writes state| DB
    BackendAPI -->|Pushes jobs| RedisQueue
    Builder -->|Pops jobs (blpop)| RedisQueue
    Builder -->|Reads/Writes| DB
    Builder <-->|Builds & Runs| Docker
    Builder -->|Generates Config| Nginx
    Docker -->|Serves traffic| Nginx
```

## 4. Deploy Pipeline

When a deploy is triggered, the worker executes the following step-by-step pipeline:
1. **Clone**: Clones the GitHub repository into a temporary cross-platform directory.
2. **Detect Language**: Checks for `Dockerfile`, `requirements.txt` (Python), or `package.json` (Node.js) in the target root directory.
3. **Auto-generate Dockerfile**: If no Dockerfile exists, automatically writes one based on the detected language.
4. **Docker Build**: Builds the image using the Docker SDK, streaming the build logs to Redis (and DB) in real-time.
5. **Decrypt Env Vars**: Retrieves and decrypts the project's environment variables from Supabase.
6. **Docker Run**: Stops any previous container, then starts a new container with the decrypted environment variables and strict platform resource limits.
7. **Health Check**: Waits 5 seconds and checks the container's status. If it crashed, captures the logs.
8. **Write Nginx Config**: Re-generates `deploy.conf` with a proxy mapping the project's internal port to its public subdomain.
9. **Reload Nginx**: Instructs Nginx to reload its configuration to route traffic seamlessly.

## 5. Database Schema

Tables and their columns as implemented:

* **`users`**: `id` uuid PK, `github_id` bigint unique, `username` text, `email` text, `avatar_url` text, `created_at` timestamp
* **`projects`**: `id` uuid PK, `user_id` uuid FK→users, `github_url` text, `status` text default 'QUEUED', `port` integer unique, `subdomain` text unique, `container_id` text, `root_directory` text, `start_command` text, `created_at` timestamp, `updated_at` timestamp
* **`env_vars`**: `id` uuid PK, `project_id` uuid FK→projects cascade, `key_name` text, `value_enc` text
* **`port_registry`**: `port` integer PK, `project_id` uuid FK→projects, `in_use` boolean default false (Pre-populated ports: 8001-8010)
* **`deploy_logs`**: `id` uuid PK, `project_id` uuid FK→projects cascade, `log_text` text, `created_at` timestamp

## 6. API Reference

| Endpoint | Method | Description |
| --- | --- | --- |
| `/` | GET | Health check for root API (public). |
| `/health` | GET | Returns healthy status and platform limit configs (public). |
| `/test-db` | GET | Tests connection to Supabase database (public). |
| `/projects` | GET | Fetches projects belonging to the authenticated user only. |
| `/projects/{id}` | DELETE | Deletes project (ownership verified), stops container, frees port, drops DB records. |
| `/projects/{id}/logs` | GET | Fetches build logs and live container runtime logs (ownership verified). |
| `/projects/{id}/env` | GET | Fetches and decrypts environment variables (ownership verified). |
| `/projects/{id}/env` | POST | Encrypts and saves new environment variables (ownership verified). |
| `/projects/{id}/settings` | PUT | Updates `root_directory` and `start_command` (ownership verified). |
| `/webhook/` | POST | GitHub push event webhook listener with HMAC-SHA256 verification (public). |
| `/webhook/manual` | POST | Creates a new project or redeploys an existing one (authenticated, enforces 1-app limit). |

## 7. Frontend Screens

* **Login Screen**: Minimalist glass-morphism UI for GitHub OAuth login, powered by Supabase.
* **Dashboard Screen**: Features a compact project table showing apps and deployment statuses. Clicking a project reveals a tabbed detailed view:
  * **Logs**: Real-time streaming terminal for build events and Docker runtime logs.
  * **Environment**: Secure manager for adding key/value pairs that are stored encrypted.
  * **Settings**: Configure `root_directory` and `start_command`, plus a Danger Zone to delete the app.
  * **New Project Modal**: Allows adding new repositories via their GitHub URL.

## 8. Status State Machine

A project transitions through these explicit states:
* `QUEUED`: Pushed to Redis queue, waiting for the builder worker.
* `BUILDING`: Worker is actively cloning, building, or configuring the container.
* `RUNNING`: Container successfully started and health check passed.
* `FAILED`: Deployment encountered an error, or the platform reached maximum capacity.
* `STOPPED`: When manually stopped (future) or prior to deletion.

## 9. Security

* **Secret Encryption**: All environment variables are encrypted at rest using Fernet symmetric encryption.
* **Webhook Verification**: Incoming GitHub webhooks are validated using an HMAC-SHA256 signature to guarantee authenticity.
* **Authentication**: The frontend handles GitHub OAuth login via Supabase Auth. For every API request, the frontend sends the Supabase access token in the `Authorization: Bearer <token>` header. The backend verifies this token using `supabase.auth.get_user(token)` and extracts the user's identity to enforce per-user access control.
* **User-Scoped Access**: All project endpoints verify that the authenticated user owns the resource before allowing reads, writes, or deletes.

## 10. Platform Limits

Enforced in code to maintain system stability (`config.py`):
* `MAX_RUNNING_CONTAINERS`: 2
* `MAX_APPS_PER_USER`: 1
* `PORT_RANGE`: 8001 - 8010
* Docker Memory Limit (`CONTAINER_MEM_LIMIT`): `128m`
* Docker CPU Quota (`CONTAINER_CPU_QUOTA`): `25000` (25% of 1 CPU based on a 100000 period)

## 11. Project Structure

```
D:\Deploy\
├── backend/
│   ├── config.py         # Loads env vars, constants, and sets platform limits
│   ├── main.py           # FastAPI entrypoint defining all REST API routes
│   ├── auth.py           # Supabase JWT verification and user identity extraction
│   ├── builder.py        # Worker loop for popping from Redis and running the Docker pipeline
│   ├── webhook.py        # GitHub webhook receiver and HMAC verification
│   ├── nginx_config.py   # Generator for dynamic Nginx routing blocks
│   └── database.py       # Supabase client initialization
└── frontend/
    ├── src/
    │   ├── App.jsx           # React router setup and global state for auth session
    │   ├── supabase.js       # Frontend Supabase client definition
    │   ├── index.css         # TailwindCSS configuration and custom glass UI styles
    │   └── pages/
    │       ├── Dashboard.jsx # Main user dashboard with project tables and detailed tabs
    │       └── Login.jsx     # GitHub OAuth login screen
```
