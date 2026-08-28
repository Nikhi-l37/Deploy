"""
Deploy — Dockerfile Generator
Generates Dockerfiles for Python, Node.js (frontend + backend), and Go projects.
"""
import os
import json
from detectors import detect_framework, detect_package_manager


def generate_frontend_dockerfile(framework, root_path):
    """Generate a multi-stage Dockerfile for frontend apps."""
    
    # Determine output directory
    output_dir = 'dist'  # Default for Vite
    if framework == 'cra':
        output_dir = 'build'
    elif framework == 'nextjs':
        # Next.js standalone mode
        pkg_mgr, base_image, install_cmd = detect_package_manager(root_path)
        return f"""FROM {base_image} AS builder
WORKDIR /app
COPY package*.json ./
RUN {install_cmd}
COPY . .
RUN npm run build

FROM {base_image}
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
"""
    
    # Static SPA: Vite, CRA, generic
    # The entrypoint.sh is written to the build context by run_pipeline()
    pkg_mgr, base_image, install_cmd = detect_package_manager(root_path)
    
    # Copy appropriate lock files
    if pkg_mgr == 'pnpm':
        copy_files = 'COPY package.json pnpm-lock.yaml* ./'
    elif pkg_mgr == 'yarn':
        copy_files = 'COPY package.json yarn.lock* ./'
    elif pkg_mgr == 'bun':
        copy_files = 'COPY package.json bun.lockb* ./'
    else:
        copy_files = 'COPY package*.json ./'
    
    return f"""FROM {base_image} AS builder
WORKDIR /app
{copy_files}
RUN {install_cmd}
COPY . .
RUN {'bun run build' if pkg_mgr == 'bun' else 'npm run build'}

FROM nginx:alpine
COPY --from=builder /app/{output_dir} /usr/share/nginx/html
COPY .deployly-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
"""


def generate_dockerfile(project_id: str, repo_path: str, language: str, env_vars: dict = None, build_args: dict = None, push_log=None):
    """Generates a Dockerfile if the project doesn't have one.
    
    Args:
        project_id: The project UUID
        repo_path: Path to the cloned repo
        language: Detected language ('python', 'node', 'go')
        env_vars: Decrypted environment variables
        build_args: Dict to populate with build-time args (for VITE_ vars)
        push_log: Logging function (project_id, message)
    """
    df_path = os.path.join(repo_path, "Dockerfile")
    
    # Helper to log if push_log is available
    def log(msg):
        if push_log:
            push_log(project_id, msg)
    
    if language == "python":
        content = _generate_python_dockerfile(repo_path, log)
    elif language == "node":
        content = _generate_node_dockerfile(repo_path, env_vars, build_args, log)
    elif language == "go":
        content = _generate_go_dockerfile(log)
    else:
        raise Exception(f"Cannot generate Dockerfile for unsupported language: {language}")
    
    with open(df_path, "w") as f:
        f.write(content.strip())
    log(f"Auto-generated {language} Dockerfile")


def _generate_python_dockerfile(repo_path, log):
    """Generate Dockerfile for Python projects (Flask, FastAPI, Django, generic)."""
    
    # Detect Python version from runtime.txt or .python-version
    python_version = "3.11"
    for version_file in ["runtime.txt", ".python-version"]:
        version_path = os.path.join(repo_path, version_file)
        if os.path.exists(version_path):
            try:
                with open(version_path) as f:
                    ver = f.read().strip().replace("python-", "")
                if ver and ver[0].isdigit():
                    python_version = ver
                    log(f"Detected Python {python_version} from {version_file}")
            except Exception:
                pass
            break

    # Detect Python framework and start command
    has_requirements = os.path.exists(os.path.join(repo_path, "requirements.txt"))
    has_pyproject = os.path.exists(os.path.join(repo_path, "pyproject.toml"))
    has_pipfile = os.path.exists(os.path.join(repo_path, "Pipfile"))
    has_manage_py = os.path.exists(os.path.join(repo_path, "manage.py"))

    # Read requirements to detect frameworks
    req_content = ""
    if has_requirements:
        try:
            with open(os.path.join(repo_path, "requirements.txt")) as f:
                req_content = f.read().lower()
        except Exception:
            pass

    # Determine install command
    if has_pipfile:
        install_cmd = "RUN pip install pipenv && pipenv install --deploy --system"
        copy_deps = "COPY Pipfile Pipfile.lock* ./"
    elif has_pyproject:
        install_cmd = "RUN pip install --no-cache-dir ."
        copy_deps = "COPY pyproject.toml ./\nCOPY setup.py* ./\nCOPY setup.cfg* ./"
    else:
        install_cmd = "RUN pip install --no-cache-dir -r requirements.txt"
        copy_deps = "COPY requirements.txt ."

    # Determine start command
    if has_manage_py:
        # Django
        start_cmd = 'CMD ["sh", "-c", "python manage.py migrate --noinput 2>/dev/null; gunicorn --bind 0.0.0.0:8080 --workers 2 $(find . -name wsgi.py -path \\\\"*/wsgi.py\\\\" | head -1 | sed \\\\"s|./||;s|/|.|g;s|.py|:application|\\\\")"]'
        log("Detected Django project")
        if "gunicorn" not in req_content:
            install_cmd += " && pip install gunicorn"
    elif "fastapi" in req_content or "uvicorn" in req_content:
        start_cmd = 'CMD ["sh", "-c", "uvicorn $(if [ -f app/main.py ]; then echo app.main:app; elif [ -f main.py ]; then echo main:app; elif [ -f app.py ]; then echo app:app; else echo app:app; fi) --host 0.0.0.0 --port 8080"]'
        log("Detected FastAPI project")
        if "uvicorn" not in req_content:
            install_cmd += " && pip install uvicorn[standard]"
    elif "flask" in req_content:
        start_cmd = 'CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:8080 --workers 2 $(if [ -f app.py ]; then echo app:app; elif [ -f main.py ]; then echo main:app; elif [ -f application.py ]; then echo application:app; else echo app:app; fi)"]'
        log("Detected Flask project")
        if "gunicorn" not in req_content:
            install_cmd += " && pip install gunicorn"
    else:
        start_cmd = 'CMD ["sh", "-c", "if [ -f main.py ]; then python main.py; elif [ -f app.py ]; then python app.py; elif [ -f manage.py ]; then python manage.py runserver 0.0.0.0:8080; else echo No entry point found && exit 1; fi"]'

    return f"""
FROM python:{python_version}-slim
WORKDIR /app
{copy_deps}
{install_cmd}
COPY . .
EXPOSE 8080
ENV PORT=8080
{start_cmd}
"""


def _generate_node_dockerfile(repo_path, env_vars, build_args, log):
    """Generate Dockerfile for Node.js projects (frontend or backend)."""
    
    framework = detect_framework(repo_path)
    if framework:
        log(f"Detected frontend framework: {framework}")
        content = generate_frontend_dockerfile(framework, repo_path)
        if env_vars and build_args is not None:
            arg_lines = []
            env_lines = []
            for k, v in env_vars.items():
                if k.startswith(('VITE_', 'REACT_APP_', 'NEXT_PUBLIC_')):
                    arg_lines.append(f"ARG {k}")
                    env_lines.append(f"ENV {k}=${k}")
                    build_args[k] = v
            if arg_lines:
                # Insert ARG + ENV after the first FROM so they're available during npm run build
                inject_lines = arg_lines + env_lines
                lines = content.splitlines()
                for i, line in enumerate(lines):
                    if line.startswith("FROM "):
                        lines = lines[:i+1] + inject_lines + lines[i+1:]
                        break
                content = "\n".join(lines)
                log(f"Injected build-time env vars: {list(build_args.keys())}")
        return content
    
    # Backend Node.js
    has_server = os.path.exists(os.path.join(repo_path, "server", "package.json"))
    has_client = os.path.exists(os.path.join(repo_path, "client", "package.json"))
    
    if has_server:
        # Monorepo with server/ directory
        content = """
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
"""
        if has_client:
            content += "COPY client/package*.json ./client/\n"
        content += """
RUN if grep -q '"build"' package.json; then (npm run build || (npm install && npm install --prefix server)); else (npm install && npm install --prefix server); fi
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
"""
        return content
    
    # Standard backend Node.js project
    # Detect if project uses Prisma (needs prisma generate during build)
    has_prisma = False
    _pkg_path = os.path.join(repo_path, 'package.json')
    if os.path.exists(_pkg_path):
        try:
            with open(_pkg_path) as _f:
                _pkg = json.load(_f)
            _all_deps = {**_pkg.get('dependencies', {}), **_pkg.get('devDependencies', {})}
            has_prisma = 'prisma' in _all_deps or '@prisma/client' in _all_deps
        except Exception:
            pass
    
    prisma_line = "\nRUN npx prisma generate" if has_prisma else ""
    pkg_mgr, _, install_cmd = detect_package_manager(repo_path)
    if pkg_mgr == 'pnpm':
        install_prefix = 'RUN corepack enable && pnpm install'
    elif pkg_mgr == 'yarn':
        install_prefix = 'RUN yarn install'
    elif pkg_mgr == 'bun':
        install_prefix = 'RUN npm install -g bun && bun install'
    else:
        install_prefix = 'RUN npm install'

    has_tsconfig = os.path.exists(os.path.join(repo_path, "tsconfig.json"))
    has_build = False
    if os.path.exists(_pkg_path):
        try:
            with open(_pkg_path) as _f:
                _p = json.load(_f)
            has_build = 'build' in _p.get('scripts', {})
        except Exception:
            pass
    
    build_line = f"\nRUN npm run build" if (has_tsconfig and has_build) else ""
    
    return f"""
FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
{install_prefix}
COPY . .{prisma_line}{build_line}
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
"""


def _generate_go_dockerfile(log):
    """Generate Dockerfile for Go projects."""
    log("Detected Go project")
    return """
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
ENV PORT=8080
CMD ["./server"]
"""
