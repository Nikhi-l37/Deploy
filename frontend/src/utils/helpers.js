export const getProjectDisplayName = (proj) => {
  if (!proj) return '';
  return proj.name || proj.github_url?.split('/').pop().replace('.git', '') || 'Project';
};

export const getStatusBadge = (status) => {
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

export const getLogColor = (text) => {
  if (!text) return 'text-[#8b949e]';
  if (text.includes('FAILED') || text.includes('Error:') || text.includes('error:') || text.includes('CRASH') || text.includes('Deploy failed:')) {
    return 'text-[#f85149] font-medium';
  }
  if (text.includes('Deploy successful') || text.includes('now live') || text.includes('is live')) {
    return 'text-[#3fb950] font-semibold';
  }
  return 'text-[#c9d1d9]';
};

export const isValidGithubUrl = (url) => {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  return githubRegex.test(trimmed);
};

export const getAppUrl = (project) => {
  if (!project) return '';
  const hostname = window.location.hostname;
  
  // Check if hostname is an IPv4 address or localhost
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || isIp;

  // Only route via subdomain if we are on a real domain with DNS configured
  if (project.subdomain && !isLocal && hostname.includes('.')) {
    const baseDomain = hostname.replace(/^www\./, '');
    return `http://${project.subdomain}.${baseDomain}`;
  }
  
  // Direct port mapping on the active host IP or localhost
  return `http://${hostname}:${project.port}`;
};
