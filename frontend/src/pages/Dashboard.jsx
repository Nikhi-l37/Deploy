import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  LogOut, Plus, Activity, Code, Globe, RefreshCw, Trash2, X, 
  Terminal, Settings, Database, Folder, Play, Save, GitBranch, 
  Layers, AlertTriangle, AlertCircle, Info, ExternalLink, Check
} from 'lucide-react';
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

  const getAppUrl = (project) => {
    const hostname = window.location.hostname;
    if (project.subdomain && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const baseDomain = hostname.replace(/^www\./, '');
      return `http://${project.subdomain}.${baseDomain}`;
    }
    return `http://${hostname}:${project.port}`;
  };

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
    if (!text) return 'text-[#8b949e]';
    if (text.includes('FAILED') || text.includes('Error') || text.includes('error') || text.includes('CRASH')) return 'text-[#f85149]';
    if (text.includes('successful') || text.includes('live') || text.includes('RUNNING') || text.includes('[APP]')) return 'text-[#3fb950]';
    if (text.includes('Detected') || text.includes('BUILDING') || text.includes('Waiting') || text.includes('Stopping')) return 'text-[#d29922]';
    if (text.includes('[BUILD]')) return 'text-[#58a6ff]';
    if (text.includes('Starting') || text.includes('Clone') || text.includes('Cloning') || text.includes('Auto-generated')) return 'text-[#79c0ff]';
    return 'text-[#c9d1d9]';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/40';
      case 'FAILED': return 'bg-[#da3633]/15 text-[#f85149] border-[#da3633]/40';
      case 'BUILDING': return 'bg-[#1f6feb]/15 text-[#58a6ff] border-[#1f6feb]/40';
      case 'QUEUED': return 'bg-[#bb8009]/15 text-[#d29922] border-[#bb8009]/40';
      case 'SLEEPING': return 'bg-[#8957e5]/15 text-[#bc8cff] border-[#8957e5]/40';
      default: return 'bg-[#21262d] text-[#8b949e] border-[#30363d]';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] antialiased">
      {/* Top GitHub Style Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#238636] flex items-center justify-center text-white shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-[#f0f6fc] tracking-tight">Deployat</h1>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                PaaS
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8b949e] bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-[#3fb950]"></span>
              <span>{user?.user_metadata?.user_name || user?.email || 'Developer'}</span>
            </div>

            <button 
              onClick={() => { setDeployStep(1); setShowModal(true); }} 
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline p-2" 
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* SECTION 1: Services List Table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-[#f0f6fc] uppercase tracking-wider">Your Services</h2>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                {projects.length} / 2 Active
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#161b22] border-b border-[#30363d] text-xs text-[#8b949e] font-semibold">
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">URL / Port</th>
                  <th className="py-3 px-4">Root Dir</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-[#8b949e]">
                      <div className="flex flex-col items-center gap-2">
                        <Layers className="w-8 h-8 text-[#484f58]" />
                        <p className="font-medium text-[#c9d1d9]">No services deployed yet</p>
                        <p className="text-xs text-[#8b949e]">Click "New Project" to deploy your first application from GitHub.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedProjectId === project.id 
                          ? 'bg-[#1f6feb]/10 border-l-4 border-l-[#2ea043]' 
                          : 'hover:bg-[#21262d]/50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <GitBranch className="w-4 h-4 text-[#8b949e]" />
                          <span className="font-semibold text-[#f0f6fc] hover:text-[#58a6ff] transition-colors">
                            {project.github_url.split('/').pop().replace('.git', '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${getStatusBadge(project.status)}`}>
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
                      <td className="py-3 px-4 font-mono text-xs">
                        {project.status === 'RUNNING' && project.port ? (
                          <a 
                            href={getAppUrl(project)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline inline-flex items-center gap-1"
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
                            className="text-[#bc8cff] hover:text-[#d2a8ff] hover:underline inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>💤 {project.subdomain && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? getAppUrl(project).replace(/^https?:\/\//, '') : `localhost:${project.port}`}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#484f58]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#8b949e] font-mono text-xs">
                        {project.root_directory || '/'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {project.status === 'SLEEPING' ? (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                window.open(`${BACKEND_URL}/wake-page/${project.id}`, '_blank');
                              }} 
                              className="px-2.5 py-1 bg-[#8957e5]/15 border border-[#8957e5]/40 rounded-md text-[#bc8cff] hover:bg-[#8957e5]/30 transition-colors flex items-center gap-1 text-xs font-medium"
                              title="Wake Up"
                            >
                              <Play className="w-3 h-3" /> Wake
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (project.status !== 'BUILDING' && project.status !== 'QUEUED') {
                                    handleManualDeploy(project.id); 
                                  }
                                }} 
                                disabled={project.status === 'BUILDING' || project.status === 'QUEUED'}
                                className="p-1.5 bg-[#21262d] border border-[#30363d] rounded-md text-[#c9d1d9] hover:text-white hover:bg-[#30363d] disabled:opacity-50 transition-colors"
                                title="Redeploy"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${project.status === 'BUILDING' ? 'animate-spin text-[#58a6ff]' : ''}`} />
                              </button>
                              {project.status === 'FAILED' && (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleDelete(project.id); 
                                  }} 
                                  className="p-1.5 bg-[#da3633]/15 border border-[#da3633]/40 rounded-md text-[#f85149] hover:bg-[#da3633]/30 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
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

        {/* SECTION 2: Selected Project Details & Tabs */}
        {selectedProject && (
          <section className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden shadow-sm flex flex-col min-h-[500px]">
            {/* Project Header Bar */}
            <div className="p-5 border-b border-[#30363d] bg-[#161b22] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#f0f6fc] flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#2ea043]" />
                  {selectedProject.github_url.split('/').pop().replace('.git', '')}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#8b949e] mt-1 font-mono">
                  <a 
                    href={selectedProject.github_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                  >
                    <Code className="w-3.5 h-3.5" /> {selectedProject.github_url.replace('https://github.com/', '')}
                  </a>
                  <span>•</span>
                  <span>ID: {selectedProject.id.substring(0,8)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleManualDeploy(selectedProject.id)}
                  disabled={selectedProject.status === 'BUILDING' || selectedProject.status === 'QUEUED'}
                  className="btn btn-primary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${selectedProject.status === 'BUILDING' ? 'animate-spin' : ''}`} />
                  Redeploy
                </button>
              </div>
            </div>

            {/* GitHub Style Navigation Tabs */}
            <div className="flex items-center px-4 border-b border-[#30363d] bg-[#0d1117]">
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'logs' 
                    ? 'border-[#2ea043] text-[#f0f6fc] font-semibold' 
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Terminal className="w-4 h-4" /> Events & Logs
              </button>
              <button 
                onClick={() => setActiveTab('env')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'env' 
                    ? 'border-[#2ea043] text-[#f0f6fc] font-semibold' 
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Database className="w-4 h-4" /> Environment
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'settings' 
                    ? 'border-[#2ea043] text-[#f0f6fc] font-semibold' 
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="p-6 flex-1 bg-[#0d1117]">
              
              {/* TAB 1: LOGS */}
              {activeTab === 'logs' && (
                <div className="h-[420px] flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" /> Live Build & Runtime Logs
                    </h3>
                    <span className="text-xs text-[#8b949e] font-mono">Real-time terminal stream</span>
                  </div>

                  <div className="flex-1 flex flex-col bg-[#010409] border border-[#30363d] rounded-md overflow-hidden font-mono text-xs shadow-inner">
                    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#f85149]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#d29922]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#3fb950]"></div>
                        <span className="ml-2 text-xs text-[#8b949e]">tty1 • {selectedProject.id.substring(0,8)}</span>
                      </div>
                      <span className="text-[11px] text-[#484f58]">UTF-8</span>
                    </div>
                    <div 
                      ref={logsContainerRef} 
                      onScroll={handleLogsScroll} 
                      className="flex-1 p-4 overflow-y-auto space-y-1 font-mono leading-relaxed"
                    >
                      {logs.length === 0 ? (
                        <p className="text-[#8b949e] italic">No logs available for this project yet.</p>
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

              {/* TAB 2: ENV VARS */}
              {activeTab === 'env' && (
                <div className="max-w-3xl space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-[#f0f6fc]">Environment Variables</h3>
                    <p className="text-xs text-[#8b949e] mt-1">
                      Variables configured here are encrypted symmetrically with Fernet at rest and injected into the container at runtime.
                    </p>
                  </div>
                  
                  <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-[#30363d] bg-[#21262d] text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      <div className="col-span-5">Key Name</div>
                      <div className="col-span-6">Encrypted Value</div>
                      <div className="col-span-1 text-center"></div>
                    </div>
                    
                    <div className="p-3 space-y-2.5">
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
                              className="input-field font-mono text-xs"
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
                              className="input-field font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button 
                              onClick={() => {
                                const newVars = envVars.filter((_, i) => i !== idx);
                                if (newVars.length === 0) newVars.push({ key: '', value: '' });
                                setEnvVars(newVars);
                              }}
                              className="p-1.5 text-[#8b949e] hover:text-[#f85149] transition-colors rounded hover:bg-[#30363d]"
                              title="Remove variable"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                      className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variable
                    </button>
                    <button onClick={handleSaveEnvVars} className="btn btn-primary">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl space-y-8">
                  
                  {/* Build Settings */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#f0f6fc]">Build & Deploy Settings</h3>
                      <p className="text-xs text-[#8b949e]">Configure monorepo root folders and runtime execution commands.</p>
                    </div>
                    
                    <div className="bg-[#161b22] border border-[#30363d] rounded-md p-5 space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-[#d29922]" /> Root Directory
                        </label>
                        <p className="text-xs text-[#8b949e]">Specify the folder inside your repo where code resides (useful for monorepos).</p>
                        <input 
                          type="text" 
                          value={rootDir}
                          onChange={(e) => setRootDir(e.target.value)}
                          placeholder="/"
                          className="input-field max-w-md font-mono text-xs"
                        />
                      </div>
                      
                      <div className="space-y-1.5 pt-4 border-t border-[#30363d]">
                        <label className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-[#3fb950]" /> Start Command
                        </label>
                        <p className="text-xs text-[#8b949e]">Override default startup command. Leave empty for auto-detection (e.g. `npm start`).</p>
                        <input 
                          type="text" 
                          value={startCmd}
                          onChange={(e) => setStartCmd(e.target.value)}
                          placeholder="e.g. node server.js"
                          className="input-field max-w-md font-mono text-xs"
                        />
                      </div>

                      <div className="pt-2">
                        <button onClick={handleSaveSettings} className="btn btn-primary">
                          <Save className="w-4 h-4" /> Save Settings
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#f85149]">Danger Zone</h3>
                      <p className="text-xs text-[#8b949e]">Destructive and irreversible actions.</p>
                    </div>
                    
                    <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-md p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-[#f0f6fc]">Delete this project</h4>
                        <p className="text-xs text-[#8b949e] mt-0.5">Stops container, removes image, frees allocated port, and drops records from Supabase.</p>
                      </div>
                      <button 
                        onClick={() => handleDelete(selectedProject.id)} 
                        className="btn btn-danger"
                      >
                        <Trash2 className="w-4 h-4" /> Delete App
                      </button>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ============================================================ */}
      {/* GITHUB-THEMED "DEPLOY NEW PROJECT" MODAL DIALOG */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-[#010409]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 animate-fade-in">
          <div 
            className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_16px_32px_rgba(1,4,9,0.85)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#238636]/15 border border-[#238636]/40 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#3fb950]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#f0f6fc]">
                    {deployStep === 1 ? 'Deploy New Project' : 'Configure Project'}
                  </h3>
                  <p className="text-[11px] text-[#8b949e]">
                    {deployStep === 1 ? 'Connect your GitHub repository' : 'Set build parameters and environment variables'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  Step {deployStep}/2
                </span>
                <button 
                  onClick={() => { setShowModal(false); setDeployStep(1); }} 
                  className="text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] p-1.5 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Modal Step 1 */}
            {deployStep === 1 ? (
              <div>
                <div className="p-6 bg-[#0d1117] space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-[#58a6ff]" /> GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="input-field font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-[#8b949e]">Must be a public repository containing a Node.js or Python application.</p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {/* GitHub Native Alert: Important */}
                    <div className="flex items-start gap-3 p-3 rounded-[6px] bg-[#161b22] border border-[#30363d] text-xs">
                      <AlertCircle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                      <div className="text-[#8b949e] leading-relaxed">
                        <strong className="text-[#f0f6fc] font-semibold mr-1.5">Important:</strong>
                        <span>Your repository must be <span className="text-[#f0f6fc] font-medium">public</span>. Private repositories are not supported yet.</span>
                      </div>
                    </div>

                    {/* GitHub Native Alert: Pro Tip */}
                    <div className="flex items-start gap-3 p-3 rounded-[6px] bg-[#161b22] border border-[#30363d] text-xs">
                      <Info className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5" />
                      <div className="text-[#8b949e] leading-relaxed">
                        <strong className="text-[#f0f6fc] font-semibold mr-1.5">Pro Tip:</strong>
                        <span>Adding a <code className="bg-[#0d1117] text-[#58a6ff] border border-[#30363d] px-1.5 py-0.5 rounded font-mono text-[11px]">Dockerfile</code> enables faster, deterministic builds. If omitted, Deployat auto-detects your runtime.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-[#161b22] border-t border-[#30363d] flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setDeployStep(1); }} 
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    disabled={!githubUrl.trim()} 
                    onClick={() => setDeployStep(2)} 
                    className="btn btn-primary"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Step 2 */
              <form onSubmit={handleCreateProject}>
                <div className="p-6 bg-[#0d1117] space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Root Directory */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-[#d29922]" /> Root Directory
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. backend (leave empty for root /)"
                      value={newRootDir}
                      onChange={(e) => setNewRootDir(e.target.value)}
                      className="input-field font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-[#8b949e]">Subfolder containing your application code if not at root.</p>
                  </div>

                  {/* Start Command */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-[#3fb950]" /> Start Command
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. npm start (auto-detected if empty)"
                      value={newStartCmd}
                      onChange={(e) => setNewStartCmd(e.target.value)}
                      className="input-field font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-[#8b949e]">Command used to start your container.</p>
                  </div>

                  {/* Environment Variables */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#bc8cff]" /> Environment Variables
                    </label>
                    <p className="text-[11px] text-[#8b949e]">Inject encrypted API keys, secrets, or configuration values.</p>
                    
                    <div className="space-y-2">
                      {newEnvVars.map((env, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="KEY"
                            value={env.key}
                            onChange={(e) => {
                              const updated = [...newEnvVars];
                              updated[i].key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                              setNewEnvVars(updated);
                            }}
                            className="input-field flex-1 font-mono text-xs"
                          />
                          <input
                            type="password"
                            placeholder="Value"
                            value={env.value}
                            onChange={(e) => {
                              const updated = [...newEnvVars];
                              updated[i].value = e.target.value;
                              setNewEnvVars(updated);
                            }}
                            className="input-field flex-1 font-mono text-xs"
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = newEnvVars.filter((_, idx) => idx !== i);
                              setNewEnvVars(updated.length ? updated : [{ key: '', value: '' }]);
                            }} 
                            className="text-[#8b949e] hover:text-[#f85149] p-1.5 rounded hover:bg-[#30363d] transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setNewEnvVars([...newEnvVars, { key: '', value: '' }])}
                      className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-medium flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variable
                    </button>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-[#161b22] border-t border-[#30363d] flex justify-between items-center">
                  <button 
                    type="button" 
                    onClick={() => setDeployStep(1)} 
                    className="btn btn-outline"
                  >
                    ← Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="btn btn-primary"
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
      )}
    </div>
  );
}
