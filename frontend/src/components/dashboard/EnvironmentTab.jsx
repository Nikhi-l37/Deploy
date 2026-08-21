import React from 'react';
import { Database, X, Plus, RefreshCw, Save } from 'lucide-react';

export default function EnvironmentTab({
  selectedProject,
  envVars,
  setEnvVars,
  handleSaveEnvVars,
  isSavingEnv
}) {
  if (!selectedProject) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-[#bc8cff]" />
          Environment Variables
        </h2>
        <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
          Variables configured here are encrypted symmetrically with Fernet at rest and securely injected into the container at runtime.
        </p>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#30363d] bg-[#21262d] text-xs font-bold text-[#8b949e] uppercase tracking-wider">
          <div className="col-span-5">Key Name</div>
          <div className="col-span-6">Encrypted Value</div>
          <div className="col-span-1 text-center"></div>
        </div>
        
        <div className="p-5 space-y-3">
          {envVars.map((ev, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <input 
                  type="text" 
                  value={ev.key}
                  onChange={(e) => {
                    const newVars = [...envVars];
                    newVars[idx].key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                    setEnvVars(newVars);
                  }}
                  placeholder="e.g. DATABASE_URL"
                  className="input-field font-mono text-xs py-2 px-3"
                />
              </div>
              <div className="col-span-6">
                <input 
                  type="password" 
                  value={ev.value}
                  onChange={(e) => {
                    const newVars = [...envVars];
                    newVars[idx].value = e.target.value;
                    setEnvVars(newVars);
                  }}
                  placeholder="••••••••••••"
                  className="input-field font-mono text-xs py-2 px-3"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button 
                  onClick={() => {
                    const newVars = envVars.filter((_, i) => i !== idx);
                    if (newVars.length === 0) newVars.push({ key: '', value: '' });
                    setEnvVars(newVars);
                  }}
                  className="p-1.5 text-[#8b949e] hover:text-[#f85149] transition-colors rounded hover:bg-[#30363d] cursor-pointer"
                  title="Remove variable"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-1">
        <button 
          onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
          className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Variable
        </button>
        <button onClick={handleSaveEnvVars} disabled={isSavingEnv} className="btn btn-primary text-xs font-semibold px-5 py-2.5">
          {isSavingEnv ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
