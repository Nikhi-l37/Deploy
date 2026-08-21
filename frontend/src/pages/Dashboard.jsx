import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  LogOut, Plus, Activity, Code, Globe, RefreshCw, Trash2, X, 
  Terminal, Settings, Database, Folder, Play, Save, GitBranch, 
  Layers, AlertTriangle, AlertCircle, Info, ExternalLink, Check, Copy, RotateCcw
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
  const [newProjectType, setNewProjectType] = useState('backend');
  
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

  // Toast & Modal Feedback States (Replacing browser alerts/confirms)
  const [toast, setToast] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCopyLogs = () => {
    if (!logs || logs.length === 0) return;
    const fullLogText = logs.map(l => l.log_text).join('\n');
    navigator.clipboard.writeText(fullLogText);
    setCopiedLogs(true);
    showToast("Build logs copied to clipboard!", "success");
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const user = session.user;
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const isValidGithubUrl = (url) => {
    if (!url || !url.trim()) return false;
    const trimmed = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    return githubRegex.test(trimmed);
  };

  const repoDetails = useMemo(() => {
    if (!githubUrl || !isValidGithubUrl(githubUrl)) return null;
    const clean = githubUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const parts = clean.split('/');
    return {
      owner: parts[parts.length - 2],
      name: parts[parts.length - 1],
      subdomain: parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30)
    };
  }, [githubUrl]);

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
      showToast("You have reached the maximum number of allowed apps (2).", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = { github_url: githubUrl, project_type: newProjectType };
      if (newRootDir.trim()) payload.root_directory = newRootDir.trim();
      if (newStartCmd.trim()) payload.start_command = newStartCmd.trim();
      
      const validEnvVars = newEnvVars.filter(ev => ev.key.trim() && ev.value.trim());
      if (validEnvVars.length > 0) payload.env_vars = validEnvVars;
      
      await api.post('/webhook/manual', payload);
      setGithubUrl('');
      setNewRootDir('');
      setNewStartCmd('');
      setNewProjectType('backend');
      setNewEnvVars([{ key: '', value: '' }]);
      setDeployStep(1);
      setShowModal(false);
      fetchProjects();
      showToast("Project deployment initiated successfully!", "success");
    } catch (err) {
      showToast('Failed to create project: ' + (err.response?.data?.detail || err.message), 'error');
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
      showToast("Redeploy initiated successfully!", "success");
    } catch (err) {
      showToast('Failed to deploy: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleWakeUp = async (projectId) => {
    try {
      await api.get(`/gateway/${projectId}`);
      fetchProjects();
      showToast("Container wake-up triggered!", "info");
    } catch (err) {
      showToast('Failed to wake up: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleRestart = async (projectId) => {
    try {
      showToast("Restarting container...", "info");
      await api.post(`/projects/${projectId}/restart`);
      fetchProjects();
      showToast("Container restarted successfully!", "success");
    } catch (err) {
      showToast('Failed to restart: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const executeDelete = async (projectId) => {
    setIsDeleting(true);
    showToast("Deleting project and cleaning up containers...", "info");
    try {
      await api.delete(`/projects/${projectId}`);
      if (selectedProjectId === projectId) setSelectedProjectId(null);
      setDeleteConfirmProject(null);
      fetchProjects();
      showToast("Project deleted successfully!", "success");
    } catch (err) {
      showToast('Failed to delete: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEnvVars = async () => {
    setIsSavingEnv(true);
    try {
      const envDict = {};
      envVars.forEach(ev => {
        if (ev.key.trim()) envDict[ev.key.trim()] = ev.value;
      });
      
      await api.post(`/projects/${selectedProjectId}/env`, {
        env_vars: envDict
      });
      showToast('Environment variables saved! Redeploy to apply changes.', 'success');
    } catch (err) {
      showToast('Failed to save env vars: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.put(`/projects/${selectedProjectId}/settings`, {
        root_directory: rootDir,
        start_command: startCmd
      });
      showToast('Settings saved! Redeploy to apply changes.', 'success');
      fetchProjects();
    } catch (err) {
      showToast('Failed to save settings: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getLogColor = (text) => {
    if (!text) return 'text-[#8b949e]';
    // Only highlight actual errors in red
    if (text.includes('FAILED') || text.includes('Error:') || text.includes('error:') || text.includes('CRASH') || text.includes('Deploy failed:')) {
      return 'text-[#f85149] font-medium';
    }
    // Highlight final successful deployment in green
    if (text.includes('Deploy successful') || text.includes('now live') || text.includes('is live')) {
      return 'text-[#3fb950] font-semibold';
    }
    // Clean, crisp, standard terminal text for all build, npm, and system logs
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
    <div className="min-h-screen bg-[#010409] text-[#c9d1d9] antialiased">
      {/* Top GitHub Style Navigation Bar (Elevated Layer) */}
      <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#238636] flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-[#f0f6fc] tracking-tight">Deployat</h1>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                PaaS
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3.5">
            <div className="hidden sm:flex items-center gap-2.5 text-sm font-medium text-[#c9d1d9] bg-[#0d1117] border border-[#30363d] px-3.5 py-1.5 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3fb950]"></span>
              <span>{user?.user_metadata?.user_name || user?.email || 'Developer'}</span>
            </div>

            <button 
              onClick={() => { setDeployStep(1); setShowModal(true); }} 
              className="btn btn-primary text-sm font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline p-2.5" 
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* SECTION 1: Services List Table (Elevated Panel) */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] tracking-tight uppercase tracking-wider">Your Services</h2>
              <span className="text-xs sm:text-sm font-mono font-semibold px-3 py-1 rounded-full bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                {projects.length} / 2 Active
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-sm sm:text-[15px]">
              <thead>
                <tr className="bg-[#161b22] border-b border-[#30363d] text-xs sm:text-[13px] text-[#8b949e] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Service Name</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">URL / Port</th>
                  <th className="py-3.5 px-5">Root Dir</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-14 text-center text-[#8b949e]">
                      <div className="flex flex-col items-center gap-2.5">
                        <Layers className="w-10 h-10 text-[#484f58]" />
                        <p className="font-semibold text-base text-[#c9d1d9]">No services deployed yet</p>
                        <p className="text-sm text-[#8b949e]">Click "New Project" to deploy your first application from GitHub.</p>
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
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <GitBranch className="w-4.5 h-4.5 text-[#2ea043]" />
                          <span className="font-bold text-base text-[#f0f6fc] hover:text-[#58a6ff] transition-colors">
                            {project.github_url.split('/').pop().replace('.git', '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(project.status)}`}>
                          {project.status === 'BUILDING' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span className={`w-2 h-2 rounded-full ${
                            project.status === 'RUNNING' ? 'bg-[#3fb950]' :
                            project.status === 'FAILED' ? 'bg-[#f85149]' :
                            project.status === 'BUILDING' ? 'bg-[#58a6ff]' :
                            project.status === 'SLEEPING' ? 'bg-[#bc8cff]' : 'bg-[#d29922]'
                          }`} />
                          {project.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-sm font-medium">
                        {project.status === 'RUNNING' && project.port ? (
                          <a 
                            href={getAppUrl(project)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{getAppUrl(project).replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : project.status === 'SLEEPING' && project.port ? (
                          <a 
                            href={`${BACKEND_URL}/wake-page/${project.id}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[#bc8cff] hover:text-[#d2a8ff] hover:underline inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>💤 {project.subdomain && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? getAppUrl(project).replace(/^https?:\/\//, '') : `localhost:${project.port}`}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-[#484f58] font-mono">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-[#8b949e] font-mono text-sm">
                        {project.root_directory || '/'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {project.status === 'SLEEPING' ? (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                window.open(`${BACKEND_URL}/wake-page/${project.id}`, '_blank');
                              }} 
                              className="px-3 py-1.5 bg-[#8957e5]/15 border border-[#8957e5]/40 rounded-md text-[#bc8cff] hover:bg-[#8957e5]/30 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer"
                              title="Wake Up Application"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Wake
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setDeleteConfirmProject(project); 
                              }} 
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
        </section>

        {/* SECTION 2: Selected Project Details & Tabs */}
        {selectedProject && (
          <section className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-sm flex flex-col min-h-[540px]">
            {/* Project Header Bar */}
            <div className="p-6 border-b border-[#30363d] bg-[#161b22] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight flex items-center gap-2.5">
                  <GitBranch className="w-6 h-6 text-[#2ea043]" />
                  {selectedProject.github_url.split('/').pop().replace('.git', '')}
                </h2>
                <div className="flex items-center gap-3 text-sm text-[#8b949e] mt-1.5 font-mono">
                  <a 
                    href={selectedProject.github_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#58a6ff] hover:underline inline-flex items-center gap-1.5"
                  >
                    <Code className="w-4 h-4" /> {selectedProject.github_url.replace('https://github.com/', '')}
                  </a>
                  <span>•</span>
                  <span>ID: {selectedProject.id.substring(0,8)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedProject.status === 'RUNNING' && (
                  <button 
                    onClick={() => handleRestart(selectedProject.id)}
                    className="btn btn-outline text-xs sm:text-sm font-semibold px-3.5 py-2 flex items-center gap-2 cursor-pointer shadow-sm"
                    title="Restart container without rebuild"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8b949e]" />
                    Restart
                  </button>
                )}
                <button 
                  onClick={() => handleManualDeploy(selectedProject.id)}
                  disabled={selectedProject.status === 'BUILDING'}
                  className="btn btn-primary text-xs sm:text-sm font-semibold px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Full rebuild and redeploy"
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
                className={`px-5 py-3 text-sm sm:text-[15px] font-semibold border-b-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'logs' 
                    ? 'border-[#2ea043] text-[#f0f6fc]' 
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Terminal className="w-4.5 h-4.5" /> Events & Logs
              </button>
              <button 
                onClick={() => setActiveTab('env')}
                className={`px-5 py-3 text-sm sm:text-[15px] font-semibold border-b-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'env' 
                    ? 'border-[#2ea043] text-[#f0f6fc]' 
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Database className="w-4.5 h-4.5" /> Environment
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-5 py-3 text-sm sm:text-[15px] font-semibold border-b-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'border-[#2ea043] text-[#f0f6fc]' 
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <Settings className="w-4.5 h-4.5" /> Settings
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="p-6 sm:p-7 flex-1 bg-[#0d1117]">
              
              {/* TAB 1: LOGS */}
              {activeTab === 'logs' && (
                <div className="h-[520px] flex flex-col space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs sm:text-sm font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#58a6ff]" /> Live Build & Runtime Logs
                    </h3>
                    <span className="text-xs font-mono text-[#8b949e]">Real-time terminal stream</span>
                  </div>

                  <div className="flex-1 flex flex-col bg-[#010409] border border-[#30363d] rounded-lg overflow-hidden font-mono shadow-inner">
                    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-[#f85149]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#d29922]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#3fb950]"></div>
                        <span className="ml-2 text-xs sm:text-sm text-[#8b949e]">tty1 • {selectedProject.id.substring(0,8)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {logs.length > 0 && (
                          <button
                            onClick={handleCopyLogs}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-mono transition-colors cursor-pointer"
                            title="Copy all logs to clipboard"
                          >
                            {copiedLogs ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                                <span className="text-[#3fb950] font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                                <span>Copy Logs</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-xs text-[#484f58]">UTF-8</span>
                      </div>
                    </div>
                    <div 
                      ref={logsContainerRef} 
                      onScroll={handleLogsScroll} 
                      className="flex-1 p-5 overflow-y-auto space-y-1.5 font-mono text-[13.5px] sm:text-[14px] leading-[1.8]"
                    >
                      {logs.length === 0 ? (
                        <p className="text-[#8b949e] italic text-sm">No logs available for this project yet.</p>
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
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#f0f6fc]">Environment Variables</h3>
                    <p className="text-sm text-[#8b949e] mt-1 leading-relaxed">
                      Variables configured here are encrypted symmetrically with Fernet at rest and injected into the container at runtime.
                    </p>
                  </div>
                  
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[#30363d] bg-[#21262d] text-xs font-bold text-[#8b949e] uppercase tracking-wider">
                      <div className="col-span-5">Key Name</div>
                      <div className="col-span-6">Encrypted Value</div>
                      <div className="col-span-1 text-center"></div>
                    </div>
                    
                    <div className="p-4 space-y-3">
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
                              className="input-field font-mono text-sm py-2.5 px-3.5"
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
                              className="input-field font-mono text-sm py-2.5 px-3.5"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button 
                              onClick={() => {
                                const newVars = envVars.filter((_, i) => i !== idx);
                                if (newVars.length === 0) newVars.push({ key: '', value: '' });
                                setEnvVars(newVars);
                              }}
                              className="p-2 text-[#8b949e] hover:text-[#f85149] transition-colors rounded hover:bg-[#30363d] cursor-pointer"
                              title="Remove variable"
                            >
                              <X className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                      className="text-sm text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Variable
                    </button>
                    <button onClick={handleSaveEnvVars} disabled={isSavingEnv} className="btn btn-primary text-sm font-semibold px-5 py-2.5">
                      {isSavingEnv ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save Changes</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl space-y-8">
                  
                  {/* Build Settings */}
                  <div className="space-y-3.5">
                    <div>
                      <h3 className="text-lg font-bold text-[#f0f6fc]">Build & Deploy Settings</h3>
                      <p className="text-sm text-[#8b949e]">Configure monorepo root folders and runtime execution commands.</p>
                    </div>
                    
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#d29922]" /> Root Directory
                        </label>
                        <p className="text-xs sm:text-sm text-[#8b949e]">Specify the folder inside your repo where code resides (useful for monorepos).</p>
                        <input 
                          type="text" 
                          value={rootDir}
                          onChange={(e) => setRootDir(e.target.value)}
                          placeholder="/"
                          className="input-field max-w-md font-mono text-sm py-2.5 px-3.5"
                        />
                      </div>
                      
                      <div className="space-y-2 pt-4 border-t border-[#30363d]">
                        <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                          <Play className="w-4 h-4 text-[#3fb950]" /> Start Command
                        </label>
                        <p className="text-xs sm:text-sm text-[#8b949e]">Override default startup command. Leave empty for auto-detection (e.g. `npm start`).</p>
                        <input 
                          type="text" 
                          value={startCmd}
                          onChange={(e) => setStartCmd(e.target.value)}
                          placeholder="e.g. node server.js"
                          className="input-field max-w-md font-mono text-sm py-2.5 px-3.5"
                        />
                      </div>

                      <div className="pt-2">
                        <button onClick={handleSaveSettings} disabled={isSavingSettings} className="btn btn-primary text-sm font-semibold px-5 py-2.5">
                          {isSavingSettings ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="w-4 h-4" /> Save Settings</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-3.5">
                    <div>
                      <h3 className="text-lg font-bold text-[#f85149]">Danger Zone</h3>
                      <p className="text-sm text-[#8b949e]">Destructive and irreversible actions.</p>
                    </div>
                    
                    <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-lg p-6 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-base text-[#f0f6fc]">Delete this project</h4>
                        <p className="text-xs sm:text-sm text-[#8b949e] mt-1">Stops container, removes image, frees allocated port, and drops records from Supabase.</p>
                      </div>
                      <button 
                        onClick={() => setDeleteConfirmProject(selectedProject)} 
                        className="btn btn-danger text-sm font-semibold px-5 py-2.5"
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
                  onClick={() => { setShowModal(false); setDeployStep(1); }} 
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
                        { value: 'fullstack', label: 'Full-Stack', icon: '🔗', desc: 'Both' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setNewProjectType(type.value)}
                          className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                            newProjectType === type.value
                              ? 'bg-[#238636]/15 border-[#238636]/60 text-[#f0f6fc]'
                              : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/40 hover:text-[#c9d1d9]'
                          }`}
                        >
                          <div className="text-lg mb-1">{type.icon}</div>
                          <div className="text-xs font-bold">{type.label}</div>
                          <div className="text-[10px] opacity-70 mt-0.5">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {/* GitHub Native Alert: Important */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs">
                      <AlertCircle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                      <div className="text-[#8b949e] leading-relaxed">
                        <strong className="text-[#f0f6fc] font-semibold mr-1.5">Important:</strong>
                        <span>Your repository must be <span className="text-[#f0f6fc] font-medium">public</span>. Private repositories are not supported yet.</span>
                      </div>
                    </div>

                    {/* Contextual Adaptive Tip */}
                    {newProjectType === 'fullstack' ? (
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#d29922]/30 text-xs animate-fade-in">
                        <AlertTriangle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                        <div className="text-[#8b949e] leading-relaxed">
                          <strong className="text-[#f0f6fc] font-semibold mr-1.5">Full-Stack Tip:</strong>
                          <span>Deploy frontend & backend as 2 services using <code className="bg-[#0d1117] text-[#58a6ff] border border-[#30363d] px-1 py-0.5 rounded font-mono text-[11px]">/frontend</code> and <code className="bg-[#0d1117] text-[#58a6ff] border border-[#30363d] px-1 py-0.5 rounded font-mono text-[11px]">/backend</code> root dirs.</span>
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
                    onClick={() => { setShowModal(false); setDeployStep(1); }} 
                    className="btn btn-outline text-sm font-medium px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    disabled={!isValidGithubUrl(githubUrl)} 
                    onClick={() => setDeployStep(2)} 
                    className="btn btn-primary text-sm font-semibold px-5 py-2"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Step 2 */
              <form onSubmit={handleCreateProject}>
                <div className="p-6 bg-[#0d1117] space-y-4 min-h-[400px] max-h-[60vh] overflow-y-auto">
                  {/* Subdomain Destination Card */}
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
                            className="input-field flex-1 font-mono text-xs py-2 px-3"
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
                            className="input-field flex-1 font-mono text-xs py-2 px-3"
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = newEnvVars.filter((_, idx) => idx !== i);
                              setNewEnvVars(updated.length ? updated : [{ key: '', value: '' }]);
                            }} 
                            className="text-[#8b949e] hover:text-[#f85149] p-1.5 rounded hover:bg-[#30363d] transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setNewEnvVars([...newEnvVars, { key: '', value: '' }])}
                      className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variable
                    </button>
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
      )}

      {/* Sleek Floating GitHub-style Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 bg-[#161b22]/95 backdrop-blur-xl border border-[#30363d] text-[#f0f6fc] px-4 py-3 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.4)] min-w-[280px] max-w-[400px]">
          {toast.type === 'success' && (
            <div className="w-6 h-6 rounded-full bg-[#238636]/15 border border-[#238636]/30 flex items-center justify-center text-[#3fb950] shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-6 h-6 rounded-full bg-[#da3633]/15 border border-[#da3633]/30 flex items-center justify-center text-[#f85149] shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-6 h-6 rounded-full bg-[#388bfd]/15 border border-[#388bfd]/30 flex items-center justify-center text-[#58a6ff] shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
          )}
          <div className="flex-1 text-[13px] font-medium text-[#f0f6fc] leading-snug">
            {toast.message}
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="text-[#6e7681] hover:text-[#f0f6fc] p-1 rounded-md hover:bg-[#21262d] transition-colors ml-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* GitHub Danger Zone Style Delete Confirmation Modal */}
      {deleteConfirmProject && (() => {
        const targetProjectName = deleteConfirmProject.name || deleteConfirmProject.github_url?.split('/').pop().replace('.git', '') || '';
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
                    executeDelete(deleteConfirmProject.id);
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
      })()}
    </div>
  );
}
