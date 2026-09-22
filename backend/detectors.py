"""
Deploy — Language & Framework Detectors
Detects project language, frontend framework, and package manager.
"""
import os
import json


def detect_language(repo_path: str, project_type: str = None, root_dir: str = None) -> str:
    """Detects the language/runtime of the cloned repo.
    
    Args:
        repo_path: Path to the project root
        project_type: 'frontend' or 'backend'. For frontend projects, 
                      skips Dockerfile to avoid using monolith Dockerfiles
                      that build both frontend + backend.
        root_dir: The root directory setting (e.g., 'server', 'frontend', '/').
                  When set to a subdirectory, Dockerfiles are skipped because
                  monorepo Dockerfiles usually need full-repo build context.
    """
    has_dockerfile = os.path.exists(os.path.join(repo_path, "Dockerfile"))
    has_package_json = os.path.exists(os.path.join(repo_path, "package.json"))
    has_requirements = os.path.exists(os.path.join(repo_path, "requirements.txt"))
    
    # In a subdirectory: skip Dockerfile (monorepo Dockerfiles need full-repo context)
    # e.g., server/Dockerfile has "COPY server/ ./server/" which fails when build context is server/
    is_subdirectory = root_dir and root_dir.strip("/\\ ") != ""
    
    if is_subdirectory and has_dockerfile:
        if has_package_json:
            return "node"
        elif has_requirements:
            return "python"
    
    # For frontend projects at root: prefer package.json over Dockerfile
    if project_type == "frontend" and has_package_json:
        return "node"
    
    if has_dockerfile:
        return "dockerfile"
    elif has_package_json:
        return "node"
    elif os.path.exists(os.path.join(repo_path, "requirements.txt")):
        return "python"
    elif os.path.exists(os.path.join(repo_path, "pyproject.toml")):
        return "python"
    elif os.path.exists(os.path.join(repo_path, "Pipfile")):
        return "python"
    elif os.path.exists(os.path.join(repo_path, "manage.py")):
        return "python"
    elif os.path.exists(os.path.join(repo_path, "go.mod")):
        return "go"
    elif os.path.exists(os.path.join(repo_path, "index.html")):
        return "static"
    else:
        # Check subdirectories for index.html (e.g., /public/index.html, /dist/index.html)
        for subdir in ["public", "dist", "build", "www", "html", "src"]:
            if os.path.exists(os.path.join(repo_path, subdir, "index.html")):
                return "static"
        raise Exception("Unsupported project: No Dockerfile, package.json, requirements.txt, pyproject.toml, Pipfile, go.mod, or index.html found.")


def detect_framework(root_path):
    """Detect if a Node.js project is a frontend framework or backend server.
    Returns: 'vite', 'cra', 'nextjs', 'static-spa', or None (for backend/unknown)"""
    
    # Check for framework config files
    for f in os.listdir(root_path):
        if f.startswith('vite.config'):
            return 'vite'
        if f.startswith('next.config'):
            return 'nextjs'
    
    # Check package.json dependencies
    pkg_path = os.path.join(root_path, 'package.json')
    if os.path.exists(pkg_path):
        try:
            with open(pkg_path) as f:
                pkg = json.load(f)
            deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
            
            # Check for specific frameworks
            if 'vite' in deps:
                return 'vite'
            if 'next' in deps:
                return 'nextjs'
            if 'react-scripts' in deps:
                return 'cra'
            
            # Check if it's a backend (has server frameworks)
            backend_indicators = ['express', 'fastify', 'koa', 'hapi', '@nestjs/core', 'mongoose', 'pg', 'sequelize', 'prisma']
            if any(ind in deps for ind in backend_indicators):
                return None  # It's a backend
            
            # Has a build script but no backend indicators = likely frontend
            scripts = pkg.get('scripts', {})
            if 'build' in scripts and not any(ind in deps for ind in backend_indicators):
                return 'static-spa'
        except (json.JSONDecodeError, IOError):
            pass
    
    return None  # Unknown or backend


def detect_package_manager(root_path):
    """Detect which package manager the Node.js project uses.
    Returns: (name, base_image, install_command)"""
    if os.path.exists(os.path.join(root_path, 'bun.lockb')):
        return 'bun', 'oven/bun:latest', 'bun install'
    elif os.path.exists(os.path.join(root_path, 'pnpm-lock.yaml')):
        return 'pnpm', 'node:20-alpine', 'corepack enable && pnpm install --frozen-lockfile'
    elif os.path.exists(os.path.join(root_path, 'yarn.lock')):
        return 'yarn', 'node:20-alpine', 'yarn install --frozen-lockfile'
    else:
        return 'npm', 'node:20-alpine', 'npm install'
