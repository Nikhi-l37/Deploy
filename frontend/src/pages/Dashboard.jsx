import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';
import { BACKEND_URL } from '../utils/constants';
import { 
  getProjectDisplayName, 
  getStatusBadge, 
  getLogColor, 
  getAppUrl, 
  isValidGithubUrl 
} from '../utils/helpers';

import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import OverviewTab from '../components/dashboard/OverviewTab';
import ProjectsTab from '../components/dashboard/ProjectsTab';
import LogsTab from '../components/dashboard/LogsTab';
import EnvironmentTab from '../components/dashboard/EnvironmentTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import DeployModal from '../components/modals/DeployModal';
import DeleteModal from '../components/modals/DeleteModal';
import Toast from '../components/common/Toast';

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
  
  // Terminal Logs State
  const [logs, setLogs] = useState([]);
  const [selectedLogSessionIndex, setSelectedLogSessionIndex] = useState(0);
  const logsContainerRef = useRef(null);
  const userHasScrolledUp = useRef(false);
  const isProgrammaticScroll = useRef(false);
  
  // Settings & Env Vars State
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

  const user = session?.user;
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar;

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

  // Authenticated axios instance
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
  // Fetch Projects
  const fetchProjects = async (isInitial = false) => {
    try {
      const res = await api.get('/projects');
      if (res.data.status === 'success') {
        const fetched = res.data.data;
        setProjects(fetched);
        
        // Only initialize form fields if no project is currently selected
        if (!selectedProjectId && fetched.length > 0) {
          setSelectedProjectId(fetched[0].id);
          setProjectName(fetched[0].name || fetched[0].github_url.split('/').pop().replace('.git', ''));
          setRootDir(fetched[0].root_directory || '/');
          setStartCmd(fetched[0].start_command || '');
        }
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
    fetchProjects(true);
    const interval = setInterval(() => {
      fetchProjects(false);
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

  // Select project handler
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
      setDeleteConfirmProject(null);
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

  const handleSaveSettings = async (settingsData) => {
    if (!selectedProjectId) return;
    setIsSavingSettings(true);
    try {
      await api.put(`/projects/${selectedProjectId}/settings`, {
        name: settingsData.name ? settingsData.name.trim() : undefined,
        root_directory: settingsData.root_directory ? settingsData.root_directory.trim() : '/',
        start_command: settingsData.start_command ? settingsData.start_command.trim() : ''
      });
      showToast("Project settings updated successfully.", "success");
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
    setCopiedLogs(true);
    showToast("Logs copied to clipboard!", "success");
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleCopyDeploymentId = (id) => {
    navigator.clipboard.writeText(`deploy-${id.slice(0, 8)}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showToast("Deployment Container ID copied!", "success");
  };

  // Group logs into up to 3 recent build sessions
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

  return (
    <div className="flex h-screen bg-[#010409] text-[#c9d1d9] font-sans antialiased overflow-hidden selection:bg-[#238636] selection:text-white">
      
      {/* 1. LEFT VERTICAL SIDEBAR */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProject={selectedProject}
        projects={projects}
        handleSelectProject={handleSelectProject}
        user={user}
        handleLogout={handleLogout}
        avatarUrl={avatarUrl}
        getProjectDisplayName={getProjectDisplayName}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen bg-[#010409]">
        
        {/* TOP BAR / BREADCRUMBS */}
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedProject={selectedProject}
          getStatusBadge={getStatusBadge}
          getProjectDisplayName={getProjectDisplayName}
          setDeployStep={setDeployStep}
          setShowModal={setShowModal}
        />

        {/* TAB VIEWS */}
        <main className="p-6 sm:p-8 flex-1">
          {activeTab === 'overview' && (
            <OverviewTab 
              selectedProject={selectedProject}
              getProjectDisplayName={getProjectDisplayName}
              getAppUrl={getAppUrl}
              getStatusBadge={getStatusBadge}
              handleRestart={handleRestart}
              handleManualDeploy={handleManualDeploy}
              handleCopyDeploymentId={handleCopyDeploymentId}
              copiedId={copiedId}
              user={user}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab 
              projects={projects}
              handleSelectProject={handleSelectProject}
              setActiveTab={setActiveTab}
              getProjectDisplayName={getProjectDisplayName}
              getStatusBadge={getStatusBadge}
              getAppUrl={getAppUrl}
              setDeleteConfirmProject={setDeleteConfirmProject}
              setDeployStep={setDeployStep}
              setShowModal={setShowModal}
            />
          )}

          {activeTab === 'logs' && (
            <LogsTab 
              selectedProject={selectedProject}
              getProjectDisplayName={getProjectDisplayName}
              logSessions={logSessions}
              selectedLogSessionIndex={selectedLogSessionIndex}
              setSelectedLogSessionIndex={setSelectedLogSessionIndex}
              displayedLogs={displayedLogs}
              handleCopyLogs={handleCopyLogs}
              copiedLogs={copiedLogs}
              logsContainerRef={logsContainerRef}
              handleLogsScroll={handleLogsScroll}
              getLogColor={getLogColor}
            />
          )}

          {activeTab === 'env' && (
            <EnvironmentTab 
              selectedProject={selectedProject}
              envVars={envVars}
              setEnvVars={setEnvVars}
              handleSaveEnvVars={handleSaveEnvVars}
              isSavingEnv={isSavingEnv}
            />
          )}

          {activeTab === 'settings' && selectedProject && (
            <SettingsTab 
              key={selectedProject.id}
              selectedProject={selectedProject}
              handleSaveSettings={handleSaveSettings}
              isSavingSettings={isSavingSettings}
              setDeleteConfirmProject={setDeleteConfirmProject}
            />
          )}
        </main>
      </div>

      {/* 3. MODALS & TOAST NOTIFICATIONS */}
      <DeployModal 
        showModal={showModal}
        setShowModal={setShowModal}
        deployStep={deployStep}
        setDeployStep={setDeployStep}
        githubUrl={githubUrl}
        setGithubUrl={setGithubUrl}
        newProjectType={newProjectType}
        setNewProjectType={setNewProjectType}
        repoDetails={repoDetails}
        newRootDir={newRootDir}
        setNewRootDir={setNewRootDir}
        newStartCmd={newStartCmd}
        setNewStartCmd={setNewStartCmd}
        newEnvVars={newEnvVars}
        setNewEnvVars={setNewEnvVars}
        handleCreateProject={handleCreateProject}
        isSubmitting={isSubmitting}
      />

      <DeleteModal 
        deleteConfirmProject={deleteConfirmProject}
        setDeleteConfirmProject={setDeleteConfirmProject}
        deleteConfirmInput={deleteConfirmInput}
        setDeleteConfirmInput={setDeleteConfirmInput}
        isDeleting={isDeleting}
        handleDeleteProject={handleDeleteProject}
        getProjectDisplayName={getProjectDisplayName}
      />

      <Toast toast={toast} setToast={setToast} />
    </div>
  );
}
