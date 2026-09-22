import React from 'react';
import { 
  Cpu, HardDrive, Clock, Layers, Code2, Globe, 
  Server, Zap, Shield, AlertTriangle, CheckCircle2, XCircle,
  GitBranch, Container, RefreshCw, Moon
} from 'lucide-react';

export default function PlatformInfoTab() {
  const supportedStack = [
    { name: 'React / Vite', icon: '⚛️', desc: 'Static frontends with hot reload support' },
    { name: 'Next.js', icon: '▲', desc: 'SSR and static site generation' },
    { name: 'Vue / Svelte', icon: '💚', desc: 'Modern reactive frameworks' },
    { name: 'Node.js / Express', icon: '🟢', desc: 'REST APIs, GraphQL servers' },
    { name: 'Python / FastAPI', icon: '🐍', desc: 'Fast async Python APIs' },
    { name: 'Python / Flask', icon: '🧪', desc: 'Lightweight Python web apps' },
    { name: 'Go', icon: '🔵', desc: 'High-performance compiled backends' },
    { name: 'Static Sites', icon: '📄', desc: 'HTML/CSS/JS, Hugo, Jekyll' },
    { name: 'Prisma / Mongoose', icon: '🗄️', desc: 'Auto-detected ORM support' },
  ];

  const blockedPackages = [
    { name: 'PyTorch / TensorFlow', reason: 'Requires 1-2GB RAM + GPU' },
    { name: 'EasyOCR / PaddleOCR', reason: 'Depends on PyTorch (~555MB)' },
    { name: 'HuggingFace Transformers', reason: 'Requires 1GB+ RAM' },
    { name: 'Puppeteer / Playwright', reason: 'Downloads Chromium (~300MB)' },
    { name: 'YOLO / Detectron2', reason: 'Requires PyTorch + GPU' },
    { name: 'spaCy (large models)', reason: 'NLP models can be 500MB+' },
  ];

  const features = [
    { icon: <GitBranch className="w-5 h-5" />, title: 'Git-Based Deploy', desc: 'Push to GitHub → auto-build → live in minutes' },
    { icon: <Container className="w-5 h-5" />, title: 'Docker Containers', desc: 'Each project runs in an isolated Docker container' },
    { icon: <Moon className="w-5 h-5" />, title: 'Auto-Sleep & Wake', desc: 'Idle containers sleep after 5 minutes, wake on first request' },
    { icon: <RefreshCw className="w-5 h-5" />, title: 'Auto-Redeploy', desc: 'GitHub webhooks trigger automatic redeployment on push' },
    { icon: <Zap className="w-5 h-5" />, title: 'Zero Config', desc: 'Auto-detects language, generates Dockerfile, links frontend to backend' },
    { icon: <Shield className="w-5 h-5" />, title: 'Encrypted Env Vars', desc: 'Secrets are encrypted at rest with Fernet encryption' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] flex items-center gap-3">
          <Globe className="w-7 h-7 text-[#58a6ff]" />
          Platform Capabilities
        </h2>
        <p className="text-[#8b949e] mt-1">
          Everything you need to know about what Deployat can do.
        </p>
      </div>

      {/* Resource Limits */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#58a6ff]" />
          Resource Limits (Free Tier)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'RAM per Container', value: '512 MB', icon: <HardDrive className="w-4 h-4" /> },
            { label: 'Max Projects', value: '5 Apps', icon: <Layers className="w-4 h-4" /> },
            { label: 'Auto-Sleep', value: '5 minutes', icon: <Clock className="w-4 h-4" /> },
            { label: 'Build Timeout', value: '10 minutes', icon: <Zap className="w-4 h-4" /> },
          ].map((item, i) => (
            <div key={i} className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d]">
              <div className="flex items-center gap-2 text-[#8b949e] text-xs mb-2">
                {item.icon} {item.label}
              </div>
              <div className="text-xl font-bold text-[#f0f6fc]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-[#3fb950]" />
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d] flex gap-3">
              <div className="text-[#58a6ff] mt-0.5 shrink-0">{feature.icon}</div>
              <div>
                <div className="text-sm font-semibold text-[#f0f6fc]">{feature.title}</div>
                <div className="text-xs text-[#8b949e] mt-1">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Stack */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#3fb950]" />
          Supported Technologies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {supportedStack.map((tech, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#0d1117] rounded-lg px-4 py-3 border border-[#21262d]">
              <span className="text-xl">{tech.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[#f0f6fc]">{tech.name}</div>
                <div className="text-xs text-[#8b949e]">{tech.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blocked / Unsupported */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-[#f85149]" />
          Not Supported (Free Tier)
        </h3>
        <p className="text-[#8b949e] text-sm mb-4">
          These packages are automatically blocked during deployment to protect server stability.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blockedPackages.map((pkg, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#0d1117] rounded-lg px-4 py-3 border border-[#f8514933]">
              <AlertTriangle className="w-4 h-4 text-[#f85149] shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#f0f6fc]">{pkg.name}</div>
                <div className="text-xs text-[#8b949e]">{pkg.reason}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8b949e] mt-4 italic">
          For ML/AI workloads, consider Google Colab, AWS SageMaker, or Railway Pro.
        </p>
      </div>

      {/* Deploy Flow */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#bc8cff]" />
          Deployment Flow
        </h3>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0">
          {[
            { step: '1', label: 'Connect GitHub', color: 'text-[#58a6ff]' },
            { step: '2', label: 'Select Repo', color: 'text-[#3fb950]' },
            { step: '3', label: 'Auto-Detect', color: 'text-[#d29922]' },
            { step: '4', label: 'Docker Build', color: 'text-[#bc8cff]' },
            { step: '5', label: 'Live!', color: 'text-[#3fb950]' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-sm font-bold ${item.color}`}>
                  {item.step}
                </div>
                <span className="text-sm text-[#f0f6fc] font-medium">{item.label}</span>
              </div>
              {i < 4 && (
                <div className="hidden md:block w-8 h-px bg-[#30363d] mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* How to Deploy Fullstack */}
      <div className="bg-[#161b22] border border-[#1f6feb]/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#58a6ff]" />
          How to Deploy Fullstack Apps
        </h3>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Deploy Backend First', desc: 'Select "Backend" → set root directory (e.g., server/) → add DATABASE_URL if needed → Deploy', color: 'text-[#3fb950]' },
            { step: '2', title: 'Copy Backend URL', desc: 'Go to Overview tab → copy the backend service URL shown in the info box', color: 'text-[#58a6ff]' },
            { step: '3', title: 'Deploy Frontend', desc: 'Select "Frontend" → set root directory if needed → add VITE_API_URL with the backend URL → Deploy', color: 'text-[#bc8cff]' },
            { step: '4', title: 'Test & Verify', desc: 'Open your frontend → verify API calls reach the backend. Check Logs tab if issues arise.', color: 'text-[#d29922]' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#0d1117] rounded-lg px-4 py-3 border border-[#21262d]">
              <div className={`w-7 h-7 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-sm font-bold shrink-0 ${item.color}`}>
                {item.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f0f6fc]">{item.title}</div>
                <div className="text-xs text-[#8b949e] mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-[#0d1117] border border-[#1f6feb]/30">
          <p className="text-xs text-[#58a6ff]">
            <span className="font-semibold">💡 Tip:</span> You can also add <code className="bg-[#161b22] px-1 py-0.5 rounded text-[#bc8cff]">VITE_API_URL</code> after deploying — just go to Environment Variables, add it, and click Redeploy.
          </p>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#d29922]" />
          Troubleshooting
        </h3>
        <div className="space-y-3">
          {[
            { error: '500 Internal Server Error', cause: 'Database connection failed or missing env vars', fix: 'Check that DATABASE_URL, MONGODB_URI, or SUPABASE_URL are correctly set in Environment Variables.' },
            { error: '404 Not Found on API calls', cause: 'Wrong API URL or path mismatch', fix: 'Ensure VITE_API_URL matches your backend\'s service URL. If your backend routes start with /api, append /api to the URL.' },
            { error: 'CORS / Network Error', cause: 'Frontend and backend on different origins', fix: 'Already handled by the platform. If still occurring, check your backend\'s CORS settings.' },
            { error: '"Site can\'t be reached"', cause: 'Backend container is sleeping', fix: 'Visit the service URL from the dashboard to wake it up. Backends auto-wake on first request.' },
            { error: 'Build Failed', cause: 'Missing dependencies or incorrect start command', fix: 'Check the Logs tab for build errors. Ensure package.json has all required dependencies.' },
            { error: '"Method Not Allowed" (405)', cause: 'Frontend Nginx receiving API requests', fix: 'Your frontend is calling itself instead of the backend. Set VITE_API_URL to your backend\'s service URL.' },
          ].map((item, i) => (
            <div key={i} className="bg-[#0d1117] rounded-lg px-4 py-3 border border-[#21262d]">
              <div className="flex items-center gap-2 mb-1.5">
                <code className="text-xs font-mono text-[#f85149] bg-[#f8514915] px-1.5 py-0.5 rounded">{item.error}</code>
              </div>
              <p className="text-xs text-[#8b949e]">
                <span className="text-[#d29922] font-medium">Cause:</span> {item.cause}
              </p>
              <p className="text-xs text-[#8b949e] mt-1">
                <span className="text-[#3fb950] font-medium">Fix:</span> {item.fix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
