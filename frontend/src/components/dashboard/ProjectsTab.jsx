import React from 'react';
import { Layers, Plus, GitBranch, RefreshCw, ExternalLink, Play, Trash2 } from 'lucide-react';
import { BACKEND_URL } from '../../utils/constants';

export default function ProjectsTab({
  projects,
  handleSelectProject,
  setActiveTab,
  getProjectDisplayName,
  getStatusBadge,
  getAppUrl,
  setDeleteConfirmProject,
  setDeployStep,
  setShowModal
}) {
  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight">Your Services</h2>
          <p className="text-xs text-[#8b949e] mt-0.5">Overview of all containerized applications deployed on Deployat PaaS.</p>
        </div>
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#161b22] text-[#8b949e] border border-[#30363d]">
          {projects.length} / 2 Active
        </span>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#161b22] border-b border-[#30363d] text-xs text-[#8b949e] font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-5">Service Name</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">URL / Port</th>
              <th className="py-3.5 px-5">Type</th>
              <th className="py-3.5 px-5">Root Dir</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {projects.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-[#8b949e]">
                  <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#8b949e]">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-base text-[#c9d1d9]">No services deployed yet</p>
                    <p className="text-xs text-[#8b949e]">
                      Connect your GitHub repository to deploy your first application onto Deployat.
                    </p>
                    <button 
                      onClick={() => { setDeployStep(1); setShowModal(true); }}
                      className="btn btn-primary text-xs font-semibold px-4 py-2 mt-2"
                    >
                      <Plus className="w-4 h-4" /> Deploy First Service
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => {
                    handleSelectProject(project.id);
                    setActiveTab('overview');
                  }}
                  className="cursor-pointer transition-colors hover:bg-[#21262d]/60 group"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-4 h-4 text-[#2ea043] group-hover:text-[#3fb950] transition-colors" />
                      <div>
                        <span className="font-bold text-sm text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
                          {getProjectDisplayName(project)}
                        </span>
                        <span className="text-[11px] text-[#8b949e] block font-mono">ID: {project.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(project.status)}`}>
                      {project.status === 'BUILDING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'RUNNING' ? 'bg-[#3fb950]' :
                        project.status === 'FAILED' ? 'bg-[#f85149]' :
                        project.status === 'BUILDING' ? 'bg-[#58a6ff]' :
                        project.status === 'SLEEPING' ? 'bg-[#bc8cff]' : 'bg-[#d29922]'
                      }`} />
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs font-medium">
                    {project.status === 'RUNNING' && project.port ? (
                      <a 
                        href={getAppUrl(project)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{getAppUrl(project).replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : project.status === 'SLEEPING' && project.port ? (
                      <a 
                        href={`${BACKEND_URL}/wake-page/${project.id}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#bc8cff] hover:text-[#d2a8ff] hover:underline inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{getAppUrl(project).replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[#484f58] font-mono">-</span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-[11px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                      {project.project_type || 'backend'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-[#8b949e] font-mono text-xs">
                    {project.root_directory || '/'}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {project.status === 'SLEEPING' ? (
                        <button 
                          onClick={() => { 
                            window.open(`${BACKEND_URL}/wake-page/${project.id}`, '_blank');
                          }} 
                          className="px-3 py-1.5 bg-[#8957e5]/15 border border-[#8957e5]/40 rounded-md text-[#bc8cff] hover:bg-[#8957e5]/30 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                          title="Wake Up Application"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Wake
                        </button>
                      ) : (
                        <button 
                          onClick={() => setDeleteConfirmProject(project)} 
                          className="p-2 bg-[#21262d] border border-[#30363d] rounded-md text-[#8b949e] hover:text-[#f85149] hover:bg-[#da3633]/15 hover:border-[#da3633]/30 transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
