import React from 'react';
import { Layers, LayoutDashboard, Terminal, Database, Settings, LogOut } from 'lucide-react';
import DeployatLogo from '../common/DeployatLogo';
import GithubIcon from '../common/GithubIcon';

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedProject,
  projects,
  handleSelectProject,
  user,
  handleLogout,
  avatarUrl,
  getProjectDisplayName
}) {
  return (
    <aside className="w-64 bg-[#0d1117] border-r border-[#30363d] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div className="flex flex-col">
        {/* Platform Branding */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DeployatLogo className="w-8 h-8" />
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#f0f6fc] tracking-tight">Deployat</h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                PaaS
              </span>
            </div>
          </div>
        </div>

        {/* 1. ALL PROJECTS BUTTON */}
        <div className="p-3 pb-2 border-b border-[#30363d]">
          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
            }`}
          >
            <Layers className="w-4.5 h-4.5 text-[#58a6ff]" />
            <span>All Projects</span>
          </button>
        </div>

        {/* 2. PROJECT MANAGEMENT NAVIGATION */}
        <nav className="p-3 space-y-1">
          <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#8b949e] truncate">
            {selectedProject ? getProjectDisplayName(selectedProject) : 'Project'}
          </div>

          <button
            onClick={() => {
              if (!selectedProject && projects.length > 0) handleSelectProject(projects[0].id);
              setActiveTab('overview');
            }}
            disabled={projects.length === 0}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'overview'
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 text-[#58a6ff]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => {
              if (!selectedProject && projects.length > 0) handleSelectProject(projects[0].id);
              setActiveTab('logs');
            }}
            disabled={projects.length === 0}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'logs'
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
            }`}
          >
            <Terminal className="w-4.5 h-4.5 text-[#3fb950]" />
            <span>Logs</span>
          </button>

          <button
            onClick={() => {
              if (!selectedProject && projects.length > 0) handleSelectProject(projects[0].id);
              setActiveTab('env');
            }}
            disabled={projects.length === 0}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'env'
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
            }`}
          >
            <Database className="w-4.5 h-4.5 text-[#bc8cff]" />
            <span>Environment Variables</span>
          </button>

          <button
            onClick={() => {
              if (!selectedProject && projects.length > 0) handleSelectProject(projects[0].id);
              setActiveTab('settings');
            }}
            disabled={projects.length === 0}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'settings'
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
            }`}
          >
            <Settings className="w-4.5 h-4.5 text-[#d29922]" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Bottom: User Profile */}
      <div className="p-3 border-t border-[#30363d] bg-[#161b22]/40">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#161b22] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="GitHub Profile" 
                className="w-7 h-7 rounded-full border border-[#30363d] object-cover shrink-0" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#c9d1d9] shrink-0">
                <GithubIcon className="w-4 h-4" />
              </div>
            )}
            <div className="truncate">
              <div className="text-xs font-bold text-[#f0f6fc] truncate">
                {user?.user_metadata?.user_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Developer'}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            title="Log out" 
            className="text-[#8b949e] hover:text-[#f85149] p-1.5 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
