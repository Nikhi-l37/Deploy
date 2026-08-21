import React from 'react';
import { AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react';

export default function DeleteModal({
  deleteConfirmProject,
  setDeleteConfirmProject,
  deleteConfirmInput,
  setDeleteConfirmInput,
  isDeleting,
  handleDeleteProject,
  getProjectDisplayName
}) {
  if (!deleteConfirmProject) return null;

  const targetProjectName = getProjectDisplayName(deleteConfirmProject);
  const isMatched = deleteConfirmInput.trim().toLowerCase() === targetProjectName.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010409]/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div 
        className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_16px_32px_rgba(1,4,9,0.85)] max-w-lg w-full overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#da3633]/15 border border-[#da3633]/40 flex items-center justify-center text-[#f85149]">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f0f6fc] tracking-tight">Delete {targetProjectName}</h3>
              <p className="text-xs text-[#8b949e]">Danger zone confirmation</p>
            </div>
          </div>
          <button 
            onClick={() => { setDeleteConfirmProject(null); setDeleteConfirmInput(''); }}
            className="text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] p-1.5 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#0d1117] space-y-4">
          <div className="p-3.5 rounded-lg bg-[#da3633]/10 border border-[#da3633]/30 text-xs text-[#f85149] leading-relaxed">
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete the <strong>{targetProjectName}</strong> deployment, remove the Docker container and image, erase all logs, and free the assigned port.
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs sm:text-sm text-[#c9d1d9] block">
              Please type <span className="font-mono font-bold text-[#f0f6fc] bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] select-all">{targetProjectName}</span> to confirm:
            </label>
            <input 
              type="text"
              autoFocus
              placeholder={`Type "${targetProjectName}" here`}
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="input-field font-mono text-sm py-2.5 px-3.5 border-[#30363d] focus:border-[#da3633] transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#161b22] border-t border-[#30363d] flex justify-end gap-3">
          <button 
            type="button"
            disabled={isDeleting}
            onClick={() => { setDeleteConfirmProject(null); setDeleteConfirmInput(''); }} 
            className="btn btn-outline text-sm font-medium px-4 py-2"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={isDeleting || !isMatched}
            onClick={() => {
              handleDeleteProject(deleteConfirmProject.id);
              setDeleteConfirmInput('');
            }} 
            className={`btn text-sm font-semibold px-4 py-2 flex items-center gap-2 transition-all cursor-pointer ${
              isMatched
                ? 'bg-[#da3633] text-white border-[rgba(240,246,252,0.1)] hover:bg-[#b62324] shadow-md'
                : 'bg-[#21262d] border-[#30363d] text-[#6e7681] opacity-60 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
