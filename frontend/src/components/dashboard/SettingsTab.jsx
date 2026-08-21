import React, { useState, useEffect } from 'react';
import { Settings, GitBranch, Folder, Play, RefreshCw, Save, Trash2 } from 'lucide-react';
import { getProjectDisplayName } from '../../utils/helpers';

export default function SettingsTab({
  selectedProject,
  handleSaveSettings,
  isSavingSettings,
  setDeleteConfirmProject
}) {
  if (!selectedProject) return null;

  const [localName, setLocalName] = useState(getProjectDisplayName(selectedProject));
  const [localRootDir, setLocalRootDir] = useState(selectedProject.root_directory || '/');
  const [localStartCmd, setLocalStartCmd] = useState(selectedProject.start_command || '');

  // Re-sync only when switching to a DIFFERENT project
  useEffect(() => {
    setLocalName(getProjectDisplayName(selectedProject));
    setLocalRootDir(selectedProject.root_directory || '/');
    setLocalStartCmd(selectedProject.start_command || '');
  }, [selectedProject.id]);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSaveSettings({
      name: localName,
      root_directory: localRootDir,
      start_command: localStartCmd
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#d29922]" />
          Project Settings
        </h2>
        <p className="text-xs text-[#8b949e] mt-1">Configure root directories, startup commands, or permanently remove deployment.</p>
      </div>

      {/* Build Settings & Project Identity */}
      <form onSubmit={onSubmit} className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#58a6ff]" /> Project Name
          </label>
          <p className="text-xs text-[#8b949e]">Change the displayed name of this project across the dashboard, logs, and database.</p>
          <input 
            type="text" 
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="e.g. My Custom App"
            className="input-field max-w-md font-mono text-sm py-2 px-3.5"
          />
        </div>

        <div className="space-y-2 pt-4 border-t border-[#30363d]">
          <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#d29922]" /> Root Directory
          </label>
          <p className="text-xs text-[#8b949e]">Specify the folder inside your repo where code resides (useful for monorepos, e.g. <code className="bg-[#0d1117] text-[#58a6ff] px-1 py-0.5 rounded text-xs font-mono">/server</code> or <code className="bg-[#0d1117] text-[#58a6ff] px-1 py-0.5 rounded text-xs font-mono">/backend</code>).</p>
          <input 
            type="text" 
            value={localRootDir}
            onChange={(e) => setLocalRootDir(e.target.value)}
            placeholder="/server"
            className="input-field max-w-md font-mono text-sm py-2 px-3.5"
          />
        </div>
        
        <div className="space-y-2 pt-4 border-t border-[#30363d]">
          <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
            <Play className="w-4 h-4 text-[#3fb950]" /> Start Command Override
          </label>
          <p className="text-xs text-[#8b949e]">Override default startup command. Leave empty for auto-detection (e.g. <code className="bg-[#0d1117] text-[#3fb950] px-1 py-0.5 rounded text-xs font-mono">npm start</code> or <code className="bg-[#0d1117] text-[#3fb950] px-1 py-0.5 rounded text-xs font-mono">node index.js</code>).</p>
          <input 
            type="text" 
            value={localStartCmd}
            onChange={(e) => setLocalStartCmd(e.target.value)}
            placeholder="e.g. node index.js"
            className="input-field max-w-md font-mono text-sm py-2 px-3.5"
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={isSavingSettings} className="btn btn-primary text-xs font-semibold px-5 py-2.5">
            {isSavingSettings ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Settings</>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#f85149]">Danger Zone</h3>
        <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-[#f0f6fc]">Delete this project</h4>
            <p className="text-xs text-[#8b949e] mt-1">Stops Docker container, frees allocated port, and drops records from database.</p>
          </div>
          <button 
            onClick={() => setDeleteConfirmProject(selectedProject)} 
            className="btn btn-danger text-xs font-semibold px-4 py-2"
          >
            <Trash2 className="w-4 h-4" /> Delete App
          </button>
        </div>
      </div>
    </div>
  );
}
