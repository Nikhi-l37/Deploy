import React from 'react';
import { 
  Globe, ExternalLink, GitBranch, RotateCcw, RefreshCw, Copy, Check 
} from 'lucide-react';
import GithubIcon from '../common/GithubIcon';
import { BACKEND_URL } from '../../utils/constants';

export default function OverviewTab({
  selectedProject,
  getProjectDisplayName,
  getAppUrl,
  getStatusBadge,
  handleRestart,
  handleManualDeploy,
  handleCopyDeploymentId,
  copiedId,
  user
}) {
  if (!selectedProject) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      
      {/* 2. DEPLOYMENT HERO HEADER (Split Two-Column Flex Container) */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Left Side: Project Identity & Routing */}
          <div className="space-y-2.5 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight">
                {getProjectDisplayName(selectedProject)}
              </h2>
              <span className="text-[11px] font-mono uppercase font-bold px-2.5 py-0.5 rounded bg-[#21262d] text-[#bc8cff] border border-[#30363d]">
                {selectedProject.project_type || 'backend'}
              </span>
            </div>

            {/* Primary Deployment Domain Link */}
            <div className="flex items-center gap-2 text-sm font-mono font-semibold pt-0.5">
              {selectedProject.port ? (
                <a
                  href={getAppUrl(selectedProject)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline inline-flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4 text-[#58a6ff]" />
                  <span>{getAppUrl(selectedProject)}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-[#8b949e] italic">No active domain assigned</span>
              )}
            </div>

            {/* Active Branch & Commit Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8b949e]">
              <span className="inline-flex items-center gap-1.5 text-[#c9d1d9] font-medium bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                <GitBranch className="w-3.5 h-3.5 text-[#2ea043]" />
                main
              </span>
              <span>•</span>
              <a
                href={selectedProject.github_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#8b949e] hover:text-[#58a6ff] hover:underline truncate max-w-xs inline-flex items-center gap-1.5 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] transition-colors"
                title="View repository on GitHub"
              >
                <GithubIcon className="w-3.5 h-3.5 text-[#c9d1d9]" />
                <span>{selectedProject.github_url.replace('https://github.com/', '')}</span>
              </a>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d] text-[11px] font-mono">
                #{selectedProject.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Right Side: Action Control Group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            {selectedProject.status === 'RUNNING' && (
              <button
                onClick={() => handleRestart(selectedProject.id)}
                className="btn btn-outline text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
                title="Restart container without rebuild (~2s)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8b949e]" />
                Restart
              </button>
            )}

            <button
              onClick={() => handleManualDeploy(selectedProject.id)}
              disabled={selectedProject.status === 'BUILDING'}
              className="btn btn-outline text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
              title="Full Rebuild and Redeploy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${selectedProject.status === 'BUILDING' ? 'animate-spin' : ''}`} />
              Redeploy
            </button>

            {selectedProject.status === 'RUNNING' && selectedProject.port ? (
              <a
                href={getAppUrl(selectedProject)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visit Application</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            ) : selectedProject.status === 'SLEEPING' && selectedProject.port ? (
              <a
                href={`${BACKEND_URL}/wake-page/${selectedProject.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#8957e5] hover:bg-[#7a49db] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Wake App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>

        </div>
      </div>

      {/* 3. DEPLOYMENT METADATA (Structured 4-Column Data Grid) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#30363d]">
          
          {/* Field 1: Deployment ID */}
          <div className="space-y-1.5 sm:pr-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
              Deployment ID
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-mono text-sm font-bold text-[#f0f6fc]">
                deploy-{selectedProject.id.slice(0, 8)}
              </span>
              <button
                onClick={() => handleCopyDeploymentId(selectedProject.id)}
                className="p-1 text-[#8b949e] hover:text-white rounded hover:bg-[#21262d] transition-colors cursor-pointer"
                title="Copy Container ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                Container
              </span>
            </div>
          </div>

          {/* Field 2: Status & Uptime */}
          <div className="space-y-1.5 pt-4 sm:pt-0 sm:px-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
              Status & Health
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(selectedProject.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedProject.status === 'RUNNING' ? 'bg-[#3fb950] animate-pulse' :
                  selectedProject.status === 'FAILED' ? 'bg-[#f85149]' : 'bg-[#d29922]'
                }`} />
                {selectedProject.status}
              </span>
              <span className="text-xs text-[#8b949e] font-mono">
                {selectedProject.status === 'RUNNING' ? 'Live on AWS' : 'Idle'}
              </span>
            </div>
          </div>

          {/* Field 3: Port Mapping */}
          <div className="space-y-1.5 pt-4 sm:pt-0 sm:px-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
              Port Mapping
            </div>
            <div className="pt-0.5">
              {selectedProject.port ? (
                <div className="font-mono text-sm font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                  <span className="text-[#8b949e]">Internal :8080</span>
                  <span className="text-[#3fb950]">➔</span>
                  <span className="text-[#58a6ff]">Host :{selectedProject.port}</span>
                </div>
              ) : (
                <span className="text-xs font-mono text-[#8b949e]">Unassigned</span>
              )}
            </div>
          </div>

          {/* Field 4: Author / Trigger */}
          <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
              Triggered By
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <div className="w-5 h-5 rounded-full bg-[#238636]/30 border border-[#238636]/50 flex items-center justify-center text-[10px] text-[#3fb950] font-bold">
                {(user?.user_metadata?.user_name || 'N')[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-[#f0f6fc]">
                {user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Developer'}
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">
                (Git Push)
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
