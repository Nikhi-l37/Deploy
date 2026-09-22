import React, { useState } from 'react';
import { 
  Globe, GitBranch, RotateCcw, RefreshCw, Copy, Check, Cpu, Clock
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
  user,
  resourceStats
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!selectedProject) return null;

  const handleCopyUrl = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getAppUrl(selectedProject);
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isRunning = selectedProject.status === 'RUNNING';
  const isSleeping = selectedProject.status === 'SLEEPING';
  const isBuilding = selectedProject.status === 'BUILDING';

  const avatarUrl = user?.user_metadata?.avatar_url;
  const username = user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Developer';
  const initial = (username[0] || 'D').toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      
      {/* 1. PROJECT HERO CARD */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Left Side: Project Details */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f0f6fc] tracking-tight">
                {getProjectDisplayName(selectedProject)}
              </h2>
              <span className="text-[11px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded bg-[#21262d] text-[#e6edf3] border border-[#30363d]">
                {selectedProject.project_type || 'backend'}
              </span>
            </div>

            {/* Direct URL & Copy Button */}
            <div className="flex items-center gap-2 text-sm font-mono pt-0.5">
              {selectedProject.port ? (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#58a6ff] shrink-0" />
                  <a
                    href={getAppUrl(selectedProject)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-semibold"
                  >
                    {getAppUrl(selectedProject)}
                  </a>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 px-1.5 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors cursor-pointer inline-flex items-center gap-1 bg-[#0d1117] border border-[#30363d]"
                    title="Copy URL"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                        <span className="text-[11px] text-[#3fb950] font-sans">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px] text-[#8b949e] font-sans hover:text-[#f0f6fc]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#8b949e] italic">No active port assigned</span>
              )}
            </div>

            {/* Backend URL instruction for backend projects */}
            {selectedProject.project_type === 'backend' && selectedProject.port && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#1f6feb]/10 border border-[#1f6feb]/30">
                <span className="text-sm">💡</span>
                <p className="text-xs text-[#58a6ff]">
                  <span className="font-semibold">Deploying a frontend too?</span> Copy this URL and add it as{' '}
                  <code className="bg-[#0d1117] px-1 py-0.5 rounded text-[#bc8cff]">VITE_API_URL</code>{' '}
                  in your frontend's environment variables.
                </p>
              </div>
            )}

            {/* Clean Spec Badges (Without dots, with 512 MB & clean badges) */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#8b949e]">
              <span className="inline-flex items-center gap-1.5 text-[#c9d1d9] font-medium bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#30363d]">
                <GitBranch className="w-3.5 h-3.5 text-[#2ea043]" />
                main
              </span>
              <a
                href={selectedProject.github_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#8b949e] hover:text-[#58a6ff] truncate max-w-xs inline-flex items-center gap-1.5 bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#30363d] transition-colors"
                title="View repository on GitHub"
              >
                <GithubIcon className="w-3.5 h-3.5 text-[#c9d1d9]" />
                <span>{selectedProject.github_url.replace('https://github.com/', '')}</span>
              </a>
              <span className="inline-flex items-center gap-1.5 text-[#8b949e] bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#30363d]">
                <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
                {(selectedProject?.project_type === 'frontend' ? resourceStats?.mem_limit_frontend_mb : resourceStats?.mem_limit_backend_mb) || 512} MB RAM
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#8b949e] bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#30363d]">
                <Clock className="w-3.5 h-3.5 text-[#bc8cff]" />
                Auto-Sleep 5m
              </span>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            {isRunning && (
              <button
                onClick={() => handleRestart(selectedProject.id)}
                className="btn btn-outline text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
                title="Restart container (~2s)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8b949e]" />
                Restart
              </button>
            )}

            <button
              onClick={() => handleManualDeploy(selectedProject.id)}
              disabled={isBuilding}
              className="btn btn-outline text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
              title="Full Rebuild and Redeploy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBuilding ? 'animate-spin' : ''}`} />
              Redeploy
            </button>

            {isRunning && selectedProject.port ? (
              <a
                href={getAppUrl(selectedProject)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visit Application</span>
              </a>
            ) : isSleeping && selectedProject.port ? (
              <a
                href={getAppUrl(selectedProject)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#8957e5] hover:bg-[#7a49db] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Wake & Visit App</span>
              </a>
            ) : null}
          </div>

        </div>
      </div>

      {/* 2. DEPLOYMENT METADATA CARD (Clean 4-Column Summary) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Item 1: Memory & Tier */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[#8b949e]">
              Memory & Tier
            </div>
            {(() => {
              const containerName = `deploy-${selectedProject.id.substring(0, 8)}`;
              const stats = resourceStats?.data?.find(s => s.container_name === containerName);
              const memLimit = (selectedProject?.project_type === 'frontend' ? resourceStats?.mem_limit_frontend_mb : resourceStats?.mem_limit_backend_mb) || 512;
              const memUsage = stats?.mem_usage_mb || 0;
              const memPercent = memLimit > 0 ? Math.min(100, Math.round((memUsage / memLimit) * 100)) : 0;
              return (
                <div className="space-y-1.5">
                  <div className="font-mono text-sm font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                    <span>{memLimit} MB</span>
                    <span className="text-[11px] text-[#8b949e] font-sans font-normal">(Free Tier)</span>
                  </div>
                  {selectedProject.status === 'RUNNING' && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            memPercent > 85 ? 'bg-[#f85149]' : memPercent > 60 ? 'bg-[#d29922]' : 'bg-[#3fb950]'
                          }`}
                          style={{ width: `${memPercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[#8b949e] font-mono">
                        {memUsage} / {memLimit} MB ({memPercent}%)
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Item 2: Status */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[#8b949e]">
              Status
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>
          </div>

          {/* Item 3: Port Mapping */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[#8b949e]">
              Port Mapping
            </div>
            <div className="font-mono text-sm font-semibold text-[#58a6ff]">
              {selectedProject.port ? `:${selectedProject.port}` : 'Unassigned'}
            </div>
          </div>

          {/* Item 4: Triggered By */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[#8b949e]">
              Triggered By
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#f0f6fc]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-5 h-5 rounded-full border border-[#30363d]" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[10px] text-[#3fb950] font-bold">
                  {initial}
                </div>
              )}
              <span className="truncate">{username}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
