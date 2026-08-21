import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  LogOut, Plus, Activity, Code, Globe, RefreshCw, Trash2, X, 
  Terminal, Settings, Database, Folder, Play, Save, GitBranch, 
  Layers, AlertTriangle, AlertCircle, Info, ExternalLink, Check, Copy, RotateCcw, ArrowLeft,
  ChevronDown, Search, LayoutDashboard, ArrowRight, ChevronsUpDown
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const DeployatLogo = ({ className = "w-8 h-8" }) => (
  <div className={`${className} rounded-lg bg-[#238636] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#238636]/30 transition-transform hover:scale-105`}>
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5L2.5 19.5H8.5L12 12.5L15.5 19.5H21.5L12 2.5Z" />
    </svg>
  </div>
);

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
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tab States
  const [logs, setLogs] = useState([]);
  const [selectedLogSessionIndex, setSelectedLogSessionIndex] = useState(0);
  const logsContainerRef = useRef(null);
  const userHasScrolledUp = useRef(false);
  const isProgrammaticScroll = useRef(false);
  
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [rootDir, setRootDir] = useState('/');
  const [startCmd, setStartCmd] = useState('');

  // Toast & Modal Feedback States
  const [toast, setToast] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const user = session.user;
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const getProjectDisplayName = (proj) => {
    if (!proj) return '';
    return proj.name || proj.github_url?.split('/').pop().replace('.git', '') || 'Project';
  };

  const isValidGithubUrl = (url) => {
    if (!url || !url.trim()) return false;
    const trimmed = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    return githubRegex.test(trimmed);
  };

  const getAppUrl = (project) => {
    const hostname = window.location.hostname;
    if (project.subdomain && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const baseDomain = hostname.replace(/^www\./, '');
      return `http://${project.subdomain}.${baseDomain}`;
    }
    return `http://${hostname}:${project.port}`;
  };

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

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.status === 'success') {
        const fetched = res.data.data;
        setProjects(fetched);
        if (!selectedProjectId && fetched.length > 0) {
          setSelectedProjectId(fetched[0].id);
          setProjectName(fetched[0].name || fetched[0].github_url.split('/').pop().replace('.git', ''));
          setRootDir(fetched[0].root_directory || '/');
          setStartCmd(fetched[0].start_command || '');
        } else if (selectedProjectId) {
          const cur = fetched.find(p => p.id === selectedProjectId);
          if (cur) {
            setProjectName(cur.name || cur.github_url.split('/').pop().replace('.git', ''));
            setRootDir(cur.root_directory || '/');
            setStartCmd(cur.start_command || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchLogs = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/logs`);
      if (res.data.status === 'success') {
        const newLogs = res.data.data;
        setLogs(prev => {
          if (prev.length === newLogs.length && JSON.stringify(prev) === JSON.stringify(newLogs)) {
            return prev;
          }
          return newLogs;
        });
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

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
      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
    }
  }, [logs]);

  const handleLogsScroll = () => {
    if (isProgrammaticScroll.current) return;
    if (logsContainerRef.current) {
      const el = logsContainerRef.current;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      userHasScrolledUp.current = !isAtBottom;
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    userHasScrolledUp.current = false;
    fetchLogs(projectId);
    fetchEnvVars(projectId);
    
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setProjectName(proj.name || proj.github_url.split('/').pop().replace('.git', ''));
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
      showToast("Project created successfully!", "success");
      fetchProjects();
      setActiveTab('projects');
    } catch (err) {
      console.error(err);
      showToast("Failed to create project: " + (err.response?.data?.detail || err.message), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualDeploy = async (projectId) => {
    try {
      await api.post('/webhook/manual', { project_id: projectId });
      showToast("Rebuild triggered!", "success");
      fetchProjects();
    } catch (err) {
      console.error(err);
      showToast("Failed to trigger deploy: " + (err.response?.data?.detail || err.message), "error");
    }
  };

  const handleRestart = async (projectId) => {
    try {
      showToast("Restarting container...", "info");
      await api.post(`/projects/${projectId}/restart`);
      showToast("Container restarted successfully!", "success");
      fetchProjects();
    } catch (err) {
      console.error(err);
      showToast("Failed to restart: " + (err.response?.data?.detail || err.message), "error");
    }
  };

  const handleDeleteProject = async (projectId) => {
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${projectId}`);
      showToast("Project deleted successfully.", "success");
      fetchProjects();
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setActiveTab('projects');
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete project: " + (err.response?.data?.detail || err.message), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setIsSavingSettings(true);
    try {
      await api.put(`/projects/${selectedProjectId}/settings`, {
        name: projectName.trim(),
        root_directory: rootDir.trim() || '/',
        start_command: startCmd.trim()
      });
      showToast("Project settings & name updated successfully.", "success");
      fetchProjects();
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings: " + (err.response?.data?.detail || err.message), "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveEnvVars = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setIsSavingEnv(true);
    try {
      const envDict = {};
      envVars.forEach(ev => {
        if (ev.key.trim() && ev.value.trim()) {
          envDict[ev.key.trim()] = ev.value.trim();
        }
      });
      await api.post(`/projects/${selectedProjectId}/env`, { env_vars: envDict });
      showToast("Environment variables saved securely.", "success");
      fetchEnvVars(selectedProjectId);
    } catch (err) {
      console.error(err);
      showToast("Failed to save environment variables: " + (err.response?.data?.detail || err.message), "error");
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleCopyLogs = () => {
    const text = displayedLogs.map(l => l.log_text).join('\n');
    navigator.clipboard.writeText(text);
    showToast("Logs copied to clipboard!", "success");
  };

  const handleCopyDeploymentId = (id) => {
    navigator.clipboard.writeText(`deploy-${id.slice(0, 8)}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showToast("Deployment Container ID copied!", "success");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/40';
      case 'BUILDING':
      case 'QUEUED':
        return 'bg-[#1f6feb]/15 text-[#58a6ff] border-[#1f6feb]/40';
      case 'FAILED':
        return 'bg-[#da3633]/15 text-[#f85149] border-[#da3633]/40';
      case 'SLEEPING':
        return 'bg-[#8957e5]/15 text-[#bc8cff] border-[#8957e5]/40';
      default:
        return 'bg-[#6e7681]/15 text-[#8b949e] border-[#6e7681]/40';
    }
  };

  const logSessions = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    const sessions = [];
    let currentSessionLogs = [];
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (log.log_text && (log.log_text.includes("Starting build for") || log.log_text.includes("Cloning repository"))) {
        if (currentSessionLogs.length > 0) {
          sessions.push(currentSessionLogs);
          currentSessionLogs = [];
        }
      }
      currentSessionLogs.push(log);
    }
    if (currentSessionLogs.length > 0) {
      sessions.push(currentSessionLogs);
    }

    const recentSessions = sessions.slice(-3).reverse();
    return recentSessions.map((sessLogs, idx) => {
      const isLatest = idx === 0;
      const totalBuilds = sessions.length;
      const buildNumber = totalBuilds - idx;
      const hasFailed = sessLogs.some(l => l.log_text && l.log_text.toLowerCase().includes("failed"));
      const isLive = isLatest && (selectedProject?.status === 'BUILDING' || selectedProject?.status === 'RUNNING');
      
      return {
        id: `session-${buildNumber}`,
        title: isLatest ? `Latest Run (#${buildNumber})` : `Build Run #${buildNumber}`,
        buildNumber,
        isLatest,
        hasFailed,
        isLive,
        logs: sessLogs
      };
    });
  }, [logs, selectedProject?.status]);

  const displayedLogs = useMemo(() => {
    if (logSessions.length === 0) return logs;
    const session = logSessions[selectedLogSessionIndex] || logSessions[0];
    return session ? session.logs : logs;
  }, [logSessions, selectedLogSessionIndex, logs]);

  const activeDisplayLogs = displayedLogs;

  const getLogColor = (text) => {
    if (!text) return 'text-[#8b949e]';
    if (text.includes('FAILED') || text.includes('Error:') || text.includes('error:') || text.includes('CRASH') || text.includes('Deploy failed:')) {
      return 'text-[#f85149] font-medium';
    }
    if (text.includes('Deploy successful') || text.includes('now live') || text.includes('is live')) {
      return 'text-[#3fb950] font-semibold';
    }
    return 'text-[#c9d1d9]';
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar;

  return (
    <div className="flex h-screen bg-[#010409] text-[#c9d1d9] font-sans antialiased overflow-hidden selection:bg-[#238636] selection:text-white">
      
      <aside className="w-64 bg-[#0d1117] border-r border-[#30363d] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
        <div className="flex flex-col">
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DeployatLogo className="w-8 h-8" />
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#f0f6fc] tracking-tight">Deployat</h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                  PaaS
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 pb-2 border-b border-[#30363d]">
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
              }`}
            >
              <Layers className="w-4.5 h-4.5 text-[#58a6ff]" />
              <span>All Projects</span>
            </button>
          </div>

          <nav className="p-3 space-y-1">
            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#8b949e] truncate">
              {selectedProject ? getProjectDisplayName(selectedProject) : 'Project'}
            </div>

            <button
              onClick={() => {
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
                setActiveTab('overview');
              }}
              disabled={projects.length === 0}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'overview'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 text-[#58a6ff]" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
                setActiveTab('logs');
              }}
              disabled={projects.length === 0}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'logs'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
              }`}
            >
              <Terminal className="w-4.5 h-4.5 text-[#3fb950]" />
              <span>Logs</span>
            </button>

            <button
              onClick={() => {
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
                setActiveTab('env');
              }}
              disabled={projects.length === 0}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'env'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
              }`}
            >
              <Database className="w-4.5 h-4.5 text-[#bc8cff]" />
              <span>Environment Variables</span>
            </button>

            <button
              onClick={() => {
                if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
                setActiveTab('settings');
              }}
              disabled={projects.length === 0}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'settings'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent font-medium'
              }`}
            >
              <Settings className="w-4.5 h-4.5 text-[#d29922]" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-[#30363d] bg-[#161b22]/40">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#161b22] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="GitHub Profile" 
                  className="w-7 h-7 rounded-full border border-[#30363d] object-cover shrink-0" 
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#c9d1d9] shrink-0">
                  <GithubIcon className="w-4 h-4" />
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-bold text-[#f0f6fc] truncate">
                  {user?.user_metadata?.user_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Developer'}
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              title="Log out" 
              className="text-[#8b949e] hover:text-[#f85149] p-1.5 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen bg-[#010409]">
        
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

        {/* Main Content Body */}
        <main className="p-6 sm:p-8 flex-1">
          
          {/* TAB 0: MODERNIZED DEPLOYMENT OVERVIEW SCREEN */}
          {activeTab === 'overview' && selectedProject && (
            <div className="space-y-6 animate-fade-in max-w-6xl">
              
              {/* 2. DEPLOYMENT HERO HEADER (Split Two-Column Flex Container) */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 sm:p-7 shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  
                  {/* Left Side: Project Identity & Routing */}
                  <div className="space-y-2.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight">
                        {getProjectDisplayName(selectedProject)}
                      </h2>
                      <span className="text-[11px] font-mono uppercase font-bold px-2.5 py-0.5 rounded bg-[#21262d] text-[#bc8cff] border border-[#30363d]">
                        {selectedProject.project_type || 'backend'}
                      </span>
                    </div>

                    {/* Primary Deployment Domain Link */}
                    <div className="flex items-center gap-2 text-sm font-mono font-semibold pt-0.5">
                      {selectedProject.port ? (
                        <a
                          href={getAppUrl(selectedProject)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline inline-flex items-center gap-1.5"
                        >
                          <Globe className="w-4 h-4 text-[#58a6ff]" />
                          <span>{getAppUrl(selectedProject)}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#8b949e] italic">No active domain assigned</span>
                      )}
                    </div>

                    {/* Active Branch & Commit Info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8b949e]">
                      <span className="inline-flex items-center gap-1.5 text-[#c9d1d9] font-medium bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                        <GitBranch className="w-3.5 h-3.5 text-[#2ea043]" />
                        main
                      </span>
                      <span>•</span>
                      <a
                        href={selectedProject.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8b949e] hover:text-[#58a6ff] hover:underline truncate max-w-xs inline-flex items-center gap-1.5 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] transition-colors"
                        title="View repository on GitHub"
                      >
                        <GithubIcon className="w-3.5 h-3.5 text-[#c9d1d9]" />
                        <span>{selectedProject.github_url.replace('https://github.com/', '')}</span>
                      </a>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d] text-[11px] font-mono">
                        #{selectedProject.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Action Control Group */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                    {selectedProject.status === 'RUNNING' && (
                      <button
                        onClick={() => handleRestart(selectedProject.id)}
                        className="btn btn-outline text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
                        title="Restart container without rebuild (~2s)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#8b949e]" />
                        Restart
                      </button>
                    )}

                    <button
                      onClick={() => handleManualDeploy(selectedProject.id)}
                      disabled={selectedProject.status === 'BUILDING'}
                      className="btn btn-outline text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
                      title="Full Rebuild and Redeploy"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${selectedProject.status === 'BUILDING' ? 'animate-spin' : ''}`} />
                      Redeploy
                    </button>

                    {selectedProject.status === 'RUNNING' && selectedProject.port ? (
                      <a
                        href={getAppUrl(selectedProject)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Visit Application</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : selectedProject.status === 'SLEEPING' && selectedProject.port ? (
                      <a
                        href={`${BACKEND_URL}/wake-page/${selectedProject.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-[#8957e5] hover:bg-[#7a49db] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Wake App</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>

                </div>
              </div>

              {/* 3. DEPLOYMENT METADATA (Structured 4-Column Data Grid) */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#30363d]">
                  
                  {/* Field 1: Deployment ID */}
                  <div className="space-y-1.5 sm:pr-4">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
                      Deployment ID
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="font-mono text-sm font-bold text-[#f0f6fc]">
                        deploy-{selectedProject.id.slice(0, 8)}
                      </span>
                      <button
                        onClick={() => handleCopyDeploymentId(selectedProject.id)}
                        className="p-1 text-[#8b949e] hover:text-white rounded hover:bg-[#21262d] transition-colors cursor-pointer"
                        title="Copy Container ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                        Container
                      </span>
                    </div>
                  </div>

                  {/* Field 2: Status & Uptime */}
                  <div className="space-y-1.5 pt-4 sm:pt-0 sm:px-4">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
                      Status & Health
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(selectedProject.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedProject.status === 'RUNNING' ? 'bg-[#3fb950] animate-pulse' :
                          selectedProject.status === 'FAILED' ? 'bg-[#f85149]' : 'bg-[#d29922]'
                        }`} />
                        {selectedProject.status}
                      </span>
                      <span className="text-xs text-[#8b949e] font-mono">
                        {selectedProject.status === 'RUNNING' ? 'Live on AWS' : 'Idle'}
                      </span>
                    </div>
                  </div>

                  {/* Field 3: Port Mapping */}
                  <div className="space-y-1.5 pt-4 sm:pt-0 sm:px-4">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
                      Port Mapping
                    </div>
                    <div className="pt-0.5">
                      {selectedProject.port ? (
                        <div className="font-mono text-sm font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                          <span className="text-[#8b949e]">Internal :8080</span>
                          <span className="text-[#3fb950]">➔</span>
                          <span className="text-[#58a6ff]">Host :{selectedProject.port}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-[#8b949e]">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Field 4: Author / Trigger */}
                  <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-4">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e]">
                      Triggered By
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="w-5 h-5 rounded-full bg-[#238636]/30 border border-[#238636]/50 flex items-center justify-center text-[10px] text-[#3fb950] font-bold">
                        {(user?.user_metadata?.user_name || 'N')[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-[#f0f6fc]">
                        {user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Developer'}
                      </span>
                      <span className="text-[10px] font-mono text-[#8b949e]">
                        (Git Push)
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
          
          {/* TAB 1: ALL PROJECTS OVERVIEW */}
          {activeTab === 'projects' && (
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
                                <span>{project.subdomain && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? getAppUrl(project).replace(/^https?:\/\//, '') : `localhost:${project.port}`}</span>
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
          )}

          {/* TAB 2: LIVE BUILD & RUNTIME LOGS (With 3 Recent Sessions Switcher) */}
          {activeTab === 'logs' && selectedProject && (
            <div className="space-y-4 animate-fade-in max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-[#3fb950]" />
                    Logs
                  </h2>
                  <p className="text-xs text-[#8b949e] mt-0.5">Streaming build and runtime container logs in real time.</p>
                </div>

                {/* 3 Recent Log Sessions Selector Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider mr-1 hidden sm:inline">
                    History:
                  </span>
                  {logSessions.length === 0 ? (
                    <div className="text-xs font-mono text-[#8b949e] italic px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d]">
                      No build history
                    </div>
                  ) : (
                    logSessions.map((session, idx) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedLogSessionIndex(idx)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer border ${
                          selectedLogSessionIndex === idx
                            ? 'bg-[#21262d] text-[#f0f6fc] border-[#2ea043] shadow-sm'
                            : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9] hover:bg-[#21262d]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          session.isLatest ? 'bg-[#3fb950]' : session.hasFailed ? 'bg-[#f85149]' : 'bg-[#8b949e]'
                        }`} />
                        <span>{session.title}</span>
                        {session.isLatest && (
                          <span className="text-[9px] uppercase font-bold text-[#3fb950] bg-[#238636]/15 px-1.5 py-0.2 rounded border border-[#238636]/30">
                            Active
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col bg-[#010409] border border-[#30363d] rounded-xl overflow-hidden font-mono shadow-2xl h-[calc(100vh-210px)] min-h-[520px]">
                {/* Terminal Header */}
                <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#f85149]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#d29922]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#3fb950]"></div>
                    <span className="ml-2 text-xs text-[#8b949e]">
                      tty1 • {selectedProject.github_url.split('/').pop().replace('.git', '')}
                      {logSessions.length > 0 && ` [Session ${logSessions[selectedLogSessionIndex]?.buildNumber || 1}]`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeDisplayLogs.length > 0 && (
                      <button
                        onClick={handleCopyLogs}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-mono transition-colors cursor-pointer"
                        title="Copy session logs to clipboard"
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

                {/* Terminal Scroll Body */}
                <div 
                  ref={logsContainerRef} 
                  onScroll={handleLogsScroll} 
                  className="flex-1 p-5 overflow-y-auto space-y-1.5 font-mono text-[13px] sm:text-[13.5px] leading-[1.8]"
                >
                  {activeDisplayLogs.length === 0 ? (
                    <p className="text-[#8b949e] italic text-sm">No logs recorded for this session yet.</p>
                  ) : (
                    activeDisplayLogs.map((log) => (
                      <div key={log.id} className={getLogColor(log.log_text)}>
                        {log.log_text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENVIRONMENT VARIABLES (Fernet AES Encrypted Secrets) */}
          {activeTab === 'env' && selectedProject && (
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
          )}

          {/* TAB 4: SETTINGS & DANGER ZONE */}
          {activeTab === 'settings' && selectedProject && (
            <div className="space-y-8 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#d29922]" />
                  Project Settings
                </h2>
                <p className="text-xs text-[#8b949e] mt-1">Configure root directories, startup commands, or permanently remove deployment.</p>
              </div>

              {/* Build Settings & Project Identity */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#58a6ff]" /> Project Name
                  </label>
                  <p className="text-xs text-[#8b949e]">Change the displayed name of this project across the dashboard, logs, and database.</p>
                  <input 
                    type="text" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. My Custom App"
                    className="input-field max-w-md font-mono text-sm py-2 px-3.5"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-[#30363d]">
                  <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#d29922]" /> Root Directory
                  </label>
                  <p className="text-xs text-[#8b949e]">Specify the folder inside your repo where code resides (useful for monorepos).</p>
                  <input 
                    type="text" 
                    value={rootDir}
                    onChange={(e) => setRootDir(e.target.value)}
                    placeholder="/"
                    className="input-field max-w-md font-mono text-sm py-2 px-3.5"
                  />
                </div>
                
                <div className="space-y-2 pt-4 border-t border-[#30363d]">
                  <label className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#3fb950]" /> Start Command Override
                  </label>
                  <p className="text-xs text-[#8b949e]">Override default startup command. Leave empty for auto-detection (e.g. `npm start`).</p>
                  <input 
                    type="text" 
                    value={startCmd}
                    onChange={(e) => setStartCmd(e.target.value)}
                    placeholder="e.g. node server.js"
                    className="input-field max-w-md font-mono text-sm py-2 px-3.5"
                  />
                </div>

                <div className="pt-2">
                  <button onClick={handleSaveSettings} disabled={isSavingSettings} className="btn btn-primary text-xs font-semibold px-5 py-2.5">
                    {isSavingSettings ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Settings</>
                    )}
                  </button>
                </div>
              </div>

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
          )}

        </main>
      </div>

      {/* ============================================================ */}
      {/* GITHUB-THEMED "DEPLOY NEW PROJECT" MODAL DIALOG */}
      {/* ============================================================ */}
      {showModal && (
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
