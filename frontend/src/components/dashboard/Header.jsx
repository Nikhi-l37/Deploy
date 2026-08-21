import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  selectedProject,
  getStatusBadge,
  getProjectDisplayName,
  setDeployStep,
  setShowModal
}) {
  return (
    <header className="sticky top-0 z-20 bg-[#0d1117] border-b border-[#30363d] px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {activeTab === 'projects' ? (
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="font-bold text-[#f0f6fc] text-base">All Projects</span>
          </div>
        ) : selectedProject ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span 
                className="text-[#8b949e] hover:text-[#c9d1d9] cursor-pointer transition-colors"
                onClick={() => setActiveTab('projects')}
              >
                Projects
              </span>
              <span className="text-[#484f58]">/</span>
              <span className="font-bold text-[#f0f6fc] text-base">{getProjectDisplayName(selectedProject)}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(selectedProject.status)}`}>
              {selectedProject.status === 'BUILDING' && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span className={`w-1.5 h-1.5 rounded-full ${
                selectedProject.status === 'RUNNING' ? 'bg-[#3fb950] animate-pulse' :
                selectedProject.status === 'FAILED' ? 'bg-[#f85149]' :
                selectedProject.status === 'BUILDING' ? 'bg-[#58a6ff]' :
                selectedProject.status === 'SLEEPING' ? 'bg-[#bc8cff]' : 'bg-[#d29922]'
              }`} />
              {selectedProject.status}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="font-bold text-[#f0f6fc] text-base">Dashboard</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button 
          onClick={() => { setDeployStep(1); setShowModal(true); }} 
          className="btn btn-primary text-xs sm:text-sm font-semibold px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>
    </header>
  );
}
