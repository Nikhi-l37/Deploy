import React, { useState, useRef, useMemo } from 'react';
import { 
  Activity, Code, Layers, AlertCircle, AlertTriangle, Info, 
  Globe, Folder, Play, Database, Plus, RefreshCw, X, GitBranch,
  Upload, FileText
} from 'lucide-react';
import { isValidGithubUrl } from '../../utils/helpers';

export default function DeployModal({
  showModal,
  setShowModal,
  deployStep,
  setDeployStep,
  githubUrl,
  setGithubUrl,
  newProjectType,
  setNewProjectType,
  repoDetails,
  newRootDir,
  setNewRootDir,
  newStartCmd,
  setNewStartCmd,
  newEnvVars,
  setNewEnvVars,
  handleCreateProject,
  isSubmitting,
  projects = []
}) {



  // Compute allowed project types based on existing projects
  const deployRestrictions = useMemo(() => {
    const active = projects.filter(p => p.status !== 'STOPPED' && p.status !== 'FAILED');
    const types = active.map(p => p.project_type || 'backend');
    const count = active.length;

    if (count === 0) return { allowed: ['backend', 'frontend'], warning: null };
    if (count >= 2) return { allowed: [], warning: 'You have reached the 2-app limit. Delete a project first.' };

    // count === 1
    const existing = types[0];
    if (existing === 'backend') {
      return { allowed: ['frontend'], warning: 'You already have a backend deployed. You can add a frontend.' };
    }
    if (existing === 'frontend') {
      return { allowed: ['backend'], warning: 'You already have a frontend deployed. You can add a backend.' };
    }
    return { allowed: ['backend', 'frontend'], warning: null };
  }, [projects]);

  // Track paste box visibility per section (must be before early return)
  const [pasteBoxes, setPasteBoxes] = useState({});
  const [pasteContents, setPasteContents] = useState({});

  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
    setDeployStep(1);
  };


  // Parse .env file content into key-value pairs
  const parseEnvContent = (content) => {
    const vars = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key) vars.push({ key, value });
    }
    return vars;
  };

  const mergeEnvVars = (newVars, existing, setEnvVars) => {
    const merged = [...existing].filter(ev => ev.key);
    const existingKeys = new Set(merged.map(ev => ev.key));
    for (const nv of newVars) {
      if (existingKeys.has(nv.key)) {
        const idx = merged.findIndex(ev => ev.key === nv.key);
        merged[idx].value = nv.value;
      } else {
        merged.push(nv);
      }
    }
    setEnvVars(merged.length ? merged : [{ key: '', value: '' }]);
  };

  const renderEnvSection = (envVars, setEnvVars, sectionId = 'default') => {
    const fileInputRef = React.createRef();

    const handleFileUpload = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = parseEnvContent(e.target.result);
        if (parsed.length > 0) mergeEnvVars(parsed, envVars, setEnvVars);
      };
      reader.readAsText(file);
    };

    return (
      <div className="space-y-2">
        {/* .env file upload area */}
        <div
          onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-[#30363d] hover:border-[#58a6ff]/50 rounded-lg p-2.5 text-center transition-all cursor-pointer bg-[#0d1117]/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".env,.env.local,.env.production,.txt"
            className="hidden"
            onChange={(e) => { handleFileUpload(e.target.files[0]); e.target.value = ''; }}
          />
          <div className="flex items-center justify-center gap-2">
            <Upload className="w-3.5 h-3.5 text-[#8b949e]" />
            <span className="text-[11px] text-[#8b949e]">Drop .env file or click to upload</span>
          </div>
        </div>

        {envVars.map((env, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="KEY"
              value={env.key}
              onChange={(e) => {
                const updated = [...envVars];
                updated[i].key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                setEnvVars(updated);
              }}
              className="input-field flex-1 font-mono text-xs py-2 px-3"
            />
            <input
              type="password"
              placeholder="Value"
              value={env.value}
              onChange={(e) => {
                const updated = [...envVars];
                updated[i].value = e.target.value;
                setEnvVars(updated);
              }}
              className="input-field flex-1 font-mono text-xs py-2 px-3"
            />
            <button 
              type="button" 
              onClick={() => {
                const updated = envVars.filter((_, idx) => idx !== i);
                setEnvVars(updated.length ? updated : [{ key: '', value: '' }]);
              }} 
              className="text-[#8b949e] hover:text-[#f85149] p-1.5 rounded hover:bg-[#30363d] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Paste .env content */}
        {pasteBoxes[sectionId] && (
          <div className="space-y-2">
            <textarea
              value={pasteContents[sectionId] || ''}
              onChange={(e) => setPasteContents(prev => ({ ...prev, [sectionId]: e.target.value }))}
              placeholder={"# Paste .env content\nDATABASE_URL=postgres://...\nJWT_SECRET=mysecret"}
              className="w-full h-24 bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-xs font-mono text-[#c9d1d9] placeholder-[#484f58] focus:border-[#58a6ff] focus:outline-none resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setPasteBoxes(prev => ({ ...prev, [sectionId]: false }))}
                className="text-xs text-[#8b949e] hover:text-[#c9d1d9] px-2 py-1 cursor-pointer">Cancel</button>
              <button type="button" onClick={() => {
                const parsed = parseEnvContent(pasteContents[sectionId] || '');
                if (parsed.length > 0) mergeEnvVars(parsed, envVars, setEnvVars);
                setPasteBoxes(prev => ({ ...prev, [sectionId]: false }));
                setPasteContents(prev => ({ ...prev, [sectionId]: '' }));
              }} className="text-xs bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1 rounded font-semibold cursor-pointer">
                Add Variables
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
            className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 mt-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Variable
          </button>
          <button 
            type="button" 
            onClick={() => setPasteBoxes(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
            className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 mt-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Paste .env
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#010409]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 animate-fade-in">
      <div 
        className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_16px_32px_rgba(1,4,9,0.85)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#238636]/15 border border-[#238636]/40 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-[#3fb950]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#f0f6fc]">
                {deployStep === 1 ? 'Deploy New Project' : 'Configure Project'}
              </h3>
              <p className="text-xs text-[#8b949e]">
                {deployStep === 1 ? 'Import and deploy a Git repository' : 'Set build parameters and environment variables'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              Step {deployStep}/2
            </span>
            <button 
              onClick={handleClose} 
              className="text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] p-1.5 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
        
        {/* Modal Step 1 */}
        {deployStep === 1 ? (
          <div>
            <div className="p-6 bg-[#0d1117] space-y-4 min-h-[400px]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#58a6ff]" /> GitHub Repository URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className={`input-field font-mono text-sm py-2.5 px-3.5 transition-colors ${
                    githubUrl.trim() && !isValidGithubUrl(githubUrl)
                      ? 'border-[#da3633] focus:border-[#da3633]'
                      : githubUrl.trim() && isValidGithubUrl(githubUrl)
                      ? 'border-[#238636] focus:border-[#238636]'
                      : 'border-[#30363d]'
                  }`}
                />
                {githubUrl.trim() && !isValidGithubUrl(githubUrl) ? (
                  <p className="text-xs text-[#f85149] flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)
                  </p>
                ) : repoDetails ? (
                  <div className="flex items-center gap-2 pt-0.5 animate-fade-in">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#238636]/15 border border-[#238636]/40 text-xs font-mono text-[#3fb950] font-semibold">
                      <GitBranch className="w-3.5 h-3.5" /> {repoDetails.owner} / {repoDetails.name}
                    </span>
                    <span className="text-[11px] text-[#8b949e]">Public Repository</span>
                  </div>
                ) : (
                  <p className="text-xs text-[#8b949e]">Supports Node.js, Python, React, Vite, Next.js, or custom Dockerfiles.</p>
                )}
              </div>

              {/* Project Type Selector */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#bc8cff]" /> Project Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { value: 'backend', label: 'Backend', icon: '⚙️', desc: 'API / Server' },
                    { value: 'frontend', label: 'Frontend', icon: '🖥️', desc: 'Static Site' },
                  ].map((type) => {
                    const isAllowed = deployRestrictions.allowed.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => isAllowed && setNewProjectType(type.value)}
                        disabled={!isAllowed}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          !isAllowed
                            ? 'bg-[#0d1117] border-[#21262d] text-[#484f58] cursor-not-allowed opacity-50'
                            : newProjectType === type.value
                            ? 'bg-[#238636]/15 border-[#238636]/60 text-[#f0f6fc] cursor-pointer'
                            : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/40 hover:text-[#c9d1d9] cursor-pointer'
                        }`}
                      >
                        <div className="text-lg mb-1">{isAllowed ? type.icon : '🔒'}</div>
                        <div className="text-xs font-bold">{type.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{isAllowed ? type.desc : 'Unavailable'}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Restriction Warning */}
                {deployRestrictions.warning && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#d29922]/30 text-xs animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                    <div className="text-[#8b949e] leading-relaxed">
                      <strong className="text-[#f0f6fc] font-semibold mr-1.5">Slot Limit:</strong>
                      <span>{deployRestrictions.warning}</span>
                    </div>
                  </div>
                )}

                {/* Fullstack deploy tip for frontend */}
                {newProjectType === 'frontend' && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#1f6feb]/10 border border-[#1f6feb]/30 text-xs animate-fade-in">
                    <Info className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5" />
                    <div className="text-[#8b949e] leading-relaxed">
                      <strong className="text-[#f0f6fc] font-semibold mr-1.5">Deploying a fullstack app?</strong>
                      <span>Deploy your <span className="text-[#f0f6fc] font-medium">backend first</span>, copy the backend URL, then add it as{' '}
                      <code className="bg-[#0d1117] text-[#bc8cff] border border-[#30363d] px-1 py-0.5 rounded font-mono text-[11px]">VITE_API_URL</code>{' '}
                      in your frontend's environment variables.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs">
                  <AlertCircle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                  <div className="text-[#8b949e] leading-relaxed">
                    <strong className="text-[#f0f6fc] font-semibold mr-1.5">Important:</strong>
                    <span>Your repository must be <span className="text-[#f0f6fc] font-medium">public</span>. Private repositories are not supported yet.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs animate-fade-in">
                    <Info className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5" />
                    <div className="text-[#8b949e] leading-relaxed">
                      <strong className="text-[#f0f6fc] font-semibold mr-1.5">Pro Tip:</strong>
                      <span>Adding a <code className="bg-[#0d1117] text-[#58a6ff] border border-[#30363d] px-1 py-0.5 rounded font-mono text-[11px]">Dockerfile</code> enables deterministic builds. If omitted, runtime is auto-detected.</span>
                    </div>
                  </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#161b22] border-t border-[#30363d] flex justify-end gap-3">
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-outline text-sm font-medium px-4 py-2"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={!isValidGithubUrl(githubUrl) || deployRestrictions.allowed.length === 0} 
                onClick={() => setDeployStep(2)} 
                className="btn btn-primary text-sm font-semibold px-5 py-2"
              >
                Next →
              </button>
            </div>
          </div>
        ) : (
          /* Modal Step 2 — Single service (backend or frontend) */
          <form onSubmit={handleCreateProject}>
            <div className="p-6 bg-[#0d1117] space-y-4 min-h-[400px] max-h-[60vh] overflow-y-auto">
              {repoDetails && (
                <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-between shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8b949e]">Target Subdomain</div>
                      <div className="text-xs font-mono font-bold text-[#f0f6fc]">
                        {repoDetails.subdomain}.{window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : 'deployat.me'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                    {newProjectType}
                  </span>
                </div>
              )}

              {/* Root Directory */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#d29922]" /> Root Directory
                  </label>
                  <span className="text-[11px] text-[#8b949e]">Optional</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono text-sm text-[#6e7681]">/</span>
                  <input
                    type="text"
                    placeholder="backend (leave empty for repository root)"
                    value={newRootDir.replace(/^\/+/, '')}
                    onChange={(e) => setNewRootDir(e.target.value.replace(/^\/+/, ''))}
                    className="input-field font-mono text-sm py-2 pl-7 pr-3.5"
                  />
                </div>
                <p className="text-xs text-[#8b949e]">Subfolder containing your application code if not at root.</p>
              </div>

              {/* Start / Build Command */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#3fb950]" />
                    {newProjectType === 'frontend' ? 'Build & Output Command' : 'Start Command'}
                  </label>
                  <span className="text-[11px] text-[#8b949e]">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder={
                    newProjectType === 'frontend'
                      ? "npm run build (auto-detects dist/build output)"
                      : "e.g. npm start (auto-detected if empty)"
                  }
                  value={newStartCmd}
                  onChange={(e) => setNewStartCmd(e.target.value)}
                  className="input-field font-mono text-sm py-2 px-3.5"
                />
                <p className="text-xs text-[#8b949e]">
                  {newProjectType === 'frontend'
                    ? "Frontend apps (React, Vite, Next) are compiled and served via Nginx Alpine."
                    : "Command used to execute and start your backend container process."}
                </p>
              </div>

              {/* Environment Variables */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#bc8cff]" /> Environment Variables
                  </label>
                  <span className="text-[11px] text-[#8b949e]">Encrypted Fernet AES</span>
                </div>
                {renderEnvSection(newEnvVars, setNewEnvVars, 'single')}

                {/* Contextual env var hints */}
                {newProjectType === 'frontend' && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#1f6feb]/10 border border-[#1f6feb]/30">
                    <span className="text-sm">💡</span>
                    <p className="text-[11px] text-[#58a6ff] leading-relaxed">
                      <span className="font-semibold">Connecting to a backend?</span> Add{' '}
                      <code className="bg-[#0d1117] px-1 py-0.5 rounded text-[#bc8cff]">VITE_API_URL</code>{' '}
                      with your backend's service URL. You can also add this after deploying.
                    </p>
                  </div>
                )}
                {newProjectType === 'backend' && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-sm">💡</span>
                    <p className="text-[11px] text-[#8b949e] leading-relaxed">
                      <span className="font-semibold text-[#c9d1d9]">Using a database?</span> Add{' '}
                      <code className="bg-[#0d1117] px-1 py-0.5 rounded text-[#bc8cff]">DATABASE_URL</code>{' '}
                      or <code className="bg-[#0d1117] px-1 py-0.5 rounded text-[#bc8cff]">MONGODB_URI</code> here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-[#161b22] border-t border-[#30363d] flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setDeployStep(1)} 
                className="btn btn-outline text-sm font-medium px-4 py-2"
              >
                ← Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn btn-primary text-sm font-semibold px-5 py-2.5 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Deploying...</>
                ) : (
                  <><Activity className="w-4 h-4" /> Deploy App</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
