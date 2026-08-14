import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import { LogOut, Plus, Activity, Code, Globe, RefreshCw, Trash2, X, Terminal, Settings, Database, Folder, Play, Save } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function Dashboard({ session }) {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deployStep, setDeployStep] = useState(1);
  const [newEnvVars, setNewEnvVars] = useState([{ key: '', value: '' }]);
  const [newRootDir, setNewRootDir] = useState('');
  const [newStartCmd, setNewStartCmd] = useState('');
  
  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('logs');
  
  // Tab States
  const [logs, setLogs] = useState([]);
  const logsContainerRef = useRef(null);
  const userHasScrolledUp = useRef(false);
  const isProgrammaticScroll = useRef(false);
  
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [rootDir, setRootDir] = useState('/');
  const [startCmd, setStartCmd] = useState('');

  const user = session.user;
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Create an authenticated axios instance that sends the Supabase token
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: BACKEND_URL });
    instance.interceptors.request.use((config) => {
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return config;
    });
    return instance;
  }, [session?.access_token]);

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.status === 'success') {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  // Fetch logs
  const fetchLogs = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/logs`);
      if (res.data.status === 'success') {
        const newLogs = res.data.data;
        // Only update state if logs actually changed (prevents unnecessary re-render)
        setLogs(prev => {
          if (prev.length === newLogs.length && JSON.stringify(prev) === JSON.stringify(newLogs)) {
            return prev; // Same reference = no re-render
          }
          return newLogs;
        });
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  // Fetch Env Vars
  const fetchEnvVars = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/env`);
      if (res.data.status === 'success') {
        const envDict = res.data.data;
        const envArray = Object.keys(envDict).map(k => ({ key: k, value: envDict[k] }));
        if (envArray.length === 0) envArray.push({ key: '', value: '' });
        setEnvVars(envArray);
      }
    } catch (err) {
      console.error('Failed to fetch env vars:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    
    const interval = setInterval(() => {
      fetchProjects();
      if (selectedProjectId && activeTab === 'logs') {
        fetchLogs(selectedProjectId);
      }
    }, 3000);
      
    return () => clearInterval(interval);
  }, [selectedProjectId, activeTab]);

  useEffect(() => {
    if (logsContainerRef.current && !userHasScrolledUp.current) {
      const el = logsContainerRef.current;
      isProgrammaticScroll.current = true;
      el.scrollTop = el.scrollHeight;
      // Reset the flag after the browser processes the scroll
      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
    }
  }, [logs]);

  const handleLogsScroll = () => {
    // Ignore scroll events caused by our own programmatic scrolling
    if (isProgrammaticScroll.current) return;
    if (logsContainerRef.current) {
      const el = logsContainerRef.current;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      // Only the user's manual scroll decides this flag
      userHasScrolledUp.current = !isAtBottom;
    }
  };

  // Handle Project Selection
  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    userHasScrolledUp.current = false; // Reset scroll state for new project
    fetchLogs(projectId);
    fetchEnvVars(projectId);
    
    // Set Settings
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setRootDir(proj.root_directory || '/');
      setStartCmd(proj.start_command || '');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (projects.length >= 2) {
      alert("You have reached the maximum number of allowed apps (2).");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = { github_url: githubUrl };
      if (newRootDir.trim()) payload.root_directory = newRootDir.trim();
      if (newStartCmd.trim()) payload.start_command = newStartCmd.trim();
      
      const validEnvVars = newEnvVars.filter(ev => ev.key.trim() && ev.value.trim());
      if (validEnvVars.length > 0) payload.env_vars = validEnvVars;
      
      await api.post('/webhook/manual', payload);
      setGithubUrl('');
      setNewRootDir('');
      setNewStartCmd('');
      setNewEnvVars([{ key: '', value: '' }]);
      setDeployStep(1);
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualDeploy = async (projectId) => {
    try {
      await api.post('/webhook/manual', {
        project_id: projectId
      });
      fetchProjects();
      setActiveTab('logs');
    } catch (err) {
      alert('Failed to deploy: ' + err.message);
    }
  };

  const handleWakeUp = async (projectId) => {
    try {
      await api.get(`/gateway/${projectId}`);
      fetchProjects();
    } catch (err) {
      alert('Failed to wake up: ' + err.message);
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      if (selectedProjectId === projectId) setSelectedProjectId(null);
      fetchProjects();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSaveEnvVars = async () => {
    try {
      const envDict = {};
      envVars.forEach(ev => {
        if (ev.key.trim()) envDict[ev.key.trim()] = ev.value;
      });
      
      await api.post(`/projects/${selectedProjectId}/env`, {
        env_vars: envDict
      });
      alert('Environment variables saved! Redeploy to apply changes.');
    } catch (err) {
      alert('Failed to save env vars: ' + err.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put(`/projects/${selectedProjectId}/settings`, {
        root_directory: rootDir,
        start_command: startCmd
      });
      alert('Settings saved! Redeploy to apply changes.');
      fetchProjects();
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    }
  };

  const getLogColor = (text) => {
    if (!text) return 'text-gray-400';
    if (text.includes('FAILED') || text.includes('Error') || text.includes('error')) return 'text-red-400';
    if (text.includes('successful') || text.includes('live') || text.includes('RUNNING')) return 'text-green-400';
    if (text.includes('Detected') || text.includes('BUILDING')) return 'text-yellow-400';
    if (text.includes('Starting') || text.includes('Clone')) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'BUILDING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'QUEUED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'SLEEPING': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="container animate-fade-in relative max-w-6xl mx-auto py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-[#30363d]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2ea043]/10 border border-[#2ea043]/30 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#2ea043]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Deployly</h1>
            <p className="text-sm text-[#8b949e]">Welcome back, {user.user_metadata.user_name || 'Developer'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
          <button onClick={handleLogout} className="btn btn-outline p-2" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        
        {/* TOP: Compact Project List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Services</h2>
            <span className="text-xs text-gray-500 px-2 py-1 rounded bg-white/5 border border-white/10">
              {projects.length} / 2 Allowed
            </span>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <th className="p-4">Service Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">URL / Port</th>
                  <th className="p-4">Root Dir</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No services yet. Click "New Project" to deploy your first app!
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={`cursor-pointer transition-colors ${selectedProjectId === project.id ? 'bg-[#1f6feb]/10' : 'hover:bg-[#161b22]'}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#8b949e]" />
                          <span className="font-medium text-[#c9d1d9]">
                            {project.github_url.split('/').pop().replace('.git', '')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status === 'BUILDING' && <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />}
                          {project.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {project.status === 'RUNNING' && project.port ? (
                          <a 
                            href={`http://${window.location.hostname}:${project.port}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            localhost:{project.port}
                          </a>
                        ) : project.status === 'SLEEPING' && project.port ? (
                          <a 
                            href={`${BACKEND_URL}/wake-page/${project.id}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-purple-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            💤 localhost:{project.port}
                          </a>
                        ) : (
                          <span className="text-gray-600 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-400 font-mono">
                        {project.root_directory || '/'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {project.status === 'SLEEPING' ? (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                window.open(`${BACKEND_URL}/wake-page/${project.id}`, '_blank');
                              }} 
                              className="p-1.5 px-3 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
                              title="Wake Up"
                            >
                              <Play className="w-3 h-3" /> Wake
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (project.status !== 'BUILDING' && project.status !== 'QUEUED') {
                                  handleManualDeploy(project.id); 
                                }
                              }} 
                              disabled={project.status === 'BUILDING' || project.status === 'QUEUED'}
                              className="p-1.5 bg-white/5 border border-white/10 rounded text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                              title="Redeploy"
                            >
                              <RefreshCw className="w-4 h-4" />
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
        </section>

        {/* BOTTOM: Detailed Project View */}
        {selectedProject && (
          <section className="mt-4 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in flex flex-col min-h-[500px]">
            {/* Project Header */}
            <div className="p-6 border-b border-white/10 bg-slate-800/50">
              <h2 className="text-2xl font-bold mb-1">{selectedProject.github_url.split('/').pop().replace('.git', '')}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Code className="w-4 h-4" /> {selectedProject.github_url.replace('https://github.com/', '')}
                </span>
                <span>ID: {selectedProject.id.substring(0,8)}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center px-4 border-b border-[#30363d] bg-[#0d1117]">
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'logs' ? 'border-[#f78166] text-white' : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'}`}
              >
                <Terminal className="w-4 h-4" /> Events & Logs
              </button>
              <button 
                onClick={() => setActiveTab('env')}
                className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'env' ? 'border-[#f78166] text-white' : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'}`}
              >
                <Database className="w-4 h-4" /> Environment
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'settings' ? 'border-[#f78166] text-white' : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'}`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 bg-slate-900/80">
              
              {/* LOGS TAB */}
              {activeTab === 'logs' && (
                <div className="h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-300">Live Build & Deployment Logs</h3>
                    <button 
                      onClick={() => handleManualDeploy(selectedProject.id)}
                      disabled={selectedProject.status === 'BUILDING' || selectedProject.status === 'QUEUED'}
                      className="btn btn-outline py-1.5 px-3 text-xs"
                    >
                      <RefreshCw className={`w-3 h-3 mr-2 ${selectedProject.status === 'BUILDING' ? 'animate-spin' : ''}`} />
                      Manual Deploy
                    </button>
                  </div>
                  <div className="terminal-window flex-1 flex flex-col bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden font-mono text-sm shadow-inner">
                    <div className="terminal-header bg-[#161b22] border-b border-[#30363d] p-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-2 text-xs text-gray-400 font-sans">tty1 - {selectedProject.id.substring(0,8)}</span>
                    </div>
                    <div ref={logsContainerRef} onScroll={handleLogsScroll} className="flex-1 p-4 overflow-y-auto space-y-1">
                      {logs.length === 0 ? (
                        <p className="text-gray-500 italic">No logs available for this project yet.</p>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className={getLogColor(log.log_text)}>
                            {log.log_text}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ENV VARS TAB */}
              {activeTab === 'env' && (
                <div className="animate-fade-in max-w-3xl">
                  <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Set environment-specific config and secrets (such as API keys), then read those values from your code. All values are securely encrypted.
                  </p>
                  
                  <div className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden mb-6">
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-white/10 bg-slate-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-5">Key</div>
                      <div className="col-span-6">Value</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    <div className="p-2 space-y-2">
                      {envVars.map((ev, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-5">
                            <input 
                              type="text" 
                              value={ev.key}
                              onChange={(e) => {
                                const newVars = [...envVars];
                                newVars[idx].key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                                setEnvVars(newVars);
                              }}
                              placeholder="e.g. MONGO_URI"
                              className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-sm font-mono focus:border-blue-500 outline-none transition-colors"
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
                              className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-sm font-mono focus:border-blue-500 outline-none transition-colors"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button 
                              onClick={() => {
                                const newVars = envVars.filter((_, i) => i !== idx);
                                if (newVars.length === 0) newVars.push({ key: '', value: '' });
                                setEnvVars(newVars);
                              }}
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Variable
                    </button>
                    <button onClick={handleSaveEnvVars} className="btn btn-primary">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="animate-fade-in max-w-3xl space-y-8">
                  
                  {/* Build Settings */}
                  <div>
                    <h3 className="text-lg font-medium mb-1">Build & Deploy Settings</h3>
                    <p className="text-sm text-gray-400 mb-4">Configure how your application is built and executed.</p>
                    
                  <div className="space-y-4 bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#8b949e]" /> Root Directory
                        </label>
                        <p className="text-xs text-[#8b949e] mb-2">The directory inside your repository where the application code resides (useful for monorepos).</p>
                        <input 
                          type="text" 
                          value={rootDir}
                          onChange={(e) => setRootDir(e.target.value)}
                          placeholder="/"
                          className="input-field max-w-md font-mono"
                        />
                      </div>
                      
                      <div className="space-y-1.5 pt-4 border-t border-[#30363d]">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Play className="w-4 h-4 text-[#8b949e]" /> Start Command
                        </label>
                        <p className="text-xs text-[#8b949e] mb-2">Override the default start command. Leave empty to use the auto-detected command (e.g. `npm start`).</p>
                        <input 
                          type="text" 
                          value={startCmd}
                          onChange={(e) => setStartCmd(e.target.value)}
                          placeholder="e.g. node server.js"
                          className="input-field max-w-md font-mono"
                        />
                      </div>

                      <div className="pt-4">
                        <button onClick={handleSaveSettings} className="btn btn-primary">
                          <Save className="w-4 h-4" /> Save Settings
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div>
                    <h3 className="text-lg font-medium text-red-400 mb-1">Danger Zone</h3>
                    <p className="text-sm text-gray-400 mb-4">Irreversible actions for this project.</p>
                    
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-200">Delete Project</h4>
                        <p className="text-sm text-gray-400">Permanently remove this project, its logs, and release its port.</p>
                      </div>
                      <button onClick={() => handleDelete(selectedProject.id)} className="btn bg-red-500 hover:bg-red-600 text-white border-transparent">
                        <Trash2 className="w-4 h-4" /> Delete App
                      </button>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold">{deployStep === 1 ? 'Deploy New Project' : 'Configure Project'}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Step {deployStep}/2</span>
                <button onClick={() => { setShowModal(false); setDeployStep(1); }} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {deployStep === 1 ? (
              <div className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-400" /> GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/repo"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be a public repository containing a Node.js or Python app.</p>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={() => { setShowModal(false); setDeployStep(1); }} className="btn btn-outline flex-1">Cancel</button>
                  <button type="button" disabled={!githubUrl} onClick={() => setDeployStep(2)} className="btn btn-primary flex-1">
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateProject} className="p-6">
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Root Directory */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-yellow-400" /> Root Directory
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. backend (leave empty for root)"
                      value={newRootDir}
                      onChange={(e) => setNewRootDir(e.target.value)}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500">Subfolder containing your app code. Leave empty if app is in root.</p>
                  </div>

                  {/* Start Command */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-400" /> Start Command
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. npm start (auto-detected if empty)"
                      value={newStartCmd}
                      onChange={(e) => setNewStartCmd(e.target.value)}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500">Override the default start command. Leave empty for auto-detect.</p>
                  </div>

                  {/* Environment Variables */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" /> Environment Variables
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Add database URLs, API keys, secrets, etc.</p>
                    {newEnvVars.map((env, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="KEY"
                          value={env.key}
                          onChange={(e) => {
                            const updated = [...newEnvVars];
                            updated[i].key = e.target.value;
                            setNewEnvVars(updated);
                          }}
                          className="input-field flex-1 font-mono text-sm"
                        />
                        <input
                          type="text"
                          placeholder="value"
                          value={env.value}
                          onChange={(e) => {
                            const updated = [...newEnvVars];
                            updated[i].value = e.target.value;
                            setNewEnvVars(updated);
                          }}
                          className="input-field flex-1 font-mono text-sm"
                        />
                        <button type="button" onClick={() => {
                          const updated = newEnvVars.filter((_, idx) => idx !== i);
                          setNewEnvVars(updated.length ? updated : [{ key: '', value: '' }]);
                        }} className="text-red-400 hover:text-red-300 px-2">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setNewEnvVars([...newEnvVars, { key: '', value: '' }])}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> Add Variable
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setDeployStep(1)} className="btn btn-outline flex-1">← Back</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
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
      )}
    </div>
  );
}
