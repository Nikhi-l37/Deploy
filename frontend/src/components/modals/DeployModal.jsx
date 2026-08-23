import React, { useState, useMemo } from 'react';
import { 
  Activity, Code, Layers, AlertCircle, AlertTriangle, Info, 
  Globe, Folder, Play, Database, Plus, RefreshCw, X, GitBranch, Lock 
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
  // Fullstack-specific state
  const [fsBackendDir, setFsBackendDir] = useState('backend');
  const [fsBackendCmd, setFsBackendCmd] = useState('');
  const [fsBackendEnv, setFsBackendEnv] = useState([{ key: '', value: '' }]);
  const [fsFrontendDir, setFsFrontendDir] = useState('frontend');
  const [fsFrontendCmd, setFsFrontendCmd] = useState('');
  const [fsFrontendEnv, setFsFrontendEnv] = useState([{ key: '', value: '' }]);

  // Compute allowed project types based on existing projects
  const deployRestrictions = useMemo(() => {
    const active = projects.filter(p => p.status !== 'STOPPED' && p.status !== 'FAILED');
    const types = active.map(p => p.project_type || 'backend');
    const count = active.length;

    if (count === 0) return { allowed: ['backend', 'frontend', 'fullstack'], warning: null };
    if (count >= 2) return { allowed: [], warning: 'You have reached the 2-app limit. Delete a project first.' };

    // count === 1
    const existing = types[0];
    if (existing === 'fullstack') {
      return { allowed: [], warning: 'Your fullstack project uses both app slots. Delete it to deploy something new.' };
    }
    if (existing === 'backend') {
      return { allowed: ['frontend'], warning: 'You already have a backend deployed. You can add a frontend, or delete your backend to deploy fullstack.' };
    }
    if (existing === 'frontend') {
      return { allowed: ['backend'], warning: 'You already have a frontend deployed. You can add a backend, or delete your frontend to deploy fullstack.' };
    }
    return { allowed: ['backend', 'frontend', 'fullstack'], warning: null };
  }, [projects]);

  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
    setDeployStep(1);
  };

  const handleFullstackSubmit = (e) => {
    e.preventDefault();
    // For fullstack, we pass the data through a custom event-like object
    handleCreateProject(e, {
      isFullstack: true,
      backend: { rootDir: fsBackendDir, startCmd: fsBackendCmd, envVars: fsBackendEnv },
      frontend: { rootDir: fsFrontendDir, startCmd: fsFrontendCmd, envVars: fsFrontendEnv }
    });
  };

  const renderEnvSection = (envVars, setEnvVars, label = '') => (
    <div className="space-y-2">
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
      <button 
        type="button" 
        onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
        className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 mt-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Add Variable
      </button>
    </div>
  );

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
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: 'backend', label: 'Backend', icon: '⚙️', desc: 'API / Server' },
                    { value: 'frontend', label: 'Frontend', icon: '🖥️', desc: 'Static Site' },
                    { value: 'fullstack', label: 'Full-Stack', icon: '🔗', desc: 'Both (2 slots)' },
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
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs">
                  <AlertCircle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                  <div className="text-[#8b949e] leading-relaxed">
                    <strong className="text-[#f0f6fc] font-semibold mr-1.5">Important:</strong>
                    <span>Your repository must be <span className="text-[#f0f6fc] font-medium">public</span>. Private repositories are not supported yet.</span>
                  </div>
                </div>

                {newProjectType === 'fullstack' ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#d29922]/30 text-xs animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                    <div className="text-[#8b949e] leading-relaxed">
                      <strong className="text-[#f0f6fc] font-semibold mr-1.5">Full-Stack Note:</strong>
                      <span>This will create <span className="text-[#f0f6fc] font-medium">2 separate services</span> (backend + frontend) from your repo, using both app slots. Configure each on the next step.</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs animate-fade-in">
                    <Info className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5" />
                    <div className="text-[#8b949e] leading-relaxed">
                      <strong className="text-[#f0f6fc] font-semibold mr-1.5">Pro Tip:</strong>
                      <span>Adding a <code className="bg-[#0d1117] text-[#58a6ff] border border-[#30363d] px-1 py-0.5 rounded font-mono text-[11px]">Dockerfile</code> enables deterministic builds. If omitted, runtime is auto-detected.</span>
                    </div>
                  </div>
                )}
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
        ) : newProjectType === 'fullstack' ? (
          /* Modal Step 2 — FULLSTACK (dual config) */
          <form onSubmit={handleFullstackSubmit}>
            <div className="p-6 bg-[#0d1117] space-y-5 max-h-[60vh] overflow-y-auto">
              {repoDetails && (
                <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-between shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8b949e]">Repository</div>
                      <div className="text-xs font-mono font-bold text-[#f0f6fc]">
                        {repoDetails.owner}/{repoDetails.name}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#8957e5]/15 text-[#bc8cff] border border-[#8957e5]/40">
                    FULLSTACK
                  </span>
                </div>
              )}

              {/* ── Backend Service Section ── */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2">
                  <span className="text-sm">⚙️</span>
                  <span className="text-sm font-bold text-[#f0f6fc]">Backend Service</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] ml-auto">Container 1</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-[#d29922]" /> Root Directory
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-sm text-[#6e7681]">/</span>
                      <input
                        type="text"
                        placeholder="backend"
                        value={fsBackendDir}
                        onChange={(e) => setFsBackendDir(e.target.value.replace(/^\/+/, ''))}
                        className="input-field font-mono text-xs py-2 pl-7 pr-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-[#3fb950]" /> Start Command
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. npm start (auto-detected if empty)"
                      value={fsBackendCmd}
                      onChange={(e) => setFsBackendCmd(e.target.value)}
                      className="input-field font-mono text-xs py-2 px-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#bc8cff]" /> Environment Variables
                    </label>
                    {renderEnvSection(fsBackendEnv, setFsBackendEnv)}
                  </div>
                </div>
              </div>

              {/* ── Frontend Service Section ── */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2">
                  <span className="text-sm">🖥️</span>
                  <span className="text-sm font-bold text-[#f0f6fc]">Frontend Service</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] ml-auto">Container 2</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-[#d29922]" /> Root Directory
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-sm text-[#6e7681]">/</span>
                      <input
                        type="text"
                        placeholder="frontend"
                        value={fsFrontendDir}
                        onChange={(e) => setFsFrontendDir(e.target.value.replace(/^\/+/, ''))}
                        className="input-field font-mono text-xs py-2 pl-7 pr-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-[#3fb950]" /> Build Command
                    </label>
                    <input
                      type="text"
                      placeholder="npm run build (auto-detects dist/build output)"
                      value={fsFrontendCmd}
                      onChange={(e) => setFsFrontendCmd(e.target.value)}
                      className="input-field font-mono text-xs py-2 px-3"
                    />
                    <p className="text-[10px] text-[#8b949e]">Leave empty — auto-detected. Built files are served via Nginx.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#bc8cff]" /> Environment Variables
                    </label>
                    {renderEnvSection(fsFrontendEnv, setFsFrontendEnv)}
                  </div>
                </div>
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
                  <><Activity className="w-4 h-4" /> Deploy Full-Stack</>
                )}
              </button>
            </div>
          </form>
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
                {renderEnvSection(newEnvVars, setNewEnvVars)}
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
