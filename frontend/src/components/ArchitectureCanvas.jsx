import React, { useState } from 'react';
import { 
  Activity, Network, Server, Cpu, Globe, Database, 
  Lock, HardDrive, Plus, Minus, Maximize2, RefreshCw, 
  Grid, ShieldCheck, Zap, Cloud, Laptop, Layers, ArrowRight, 
  FileCode, Terminal, Key, CheckCircle2, ArrowUp, ArrowDown, RefreshCcw
} from 'lucide-react';

// =========================================================================
// HIGH-PRECISION OFFICIAL BRAND VECTOR LOGOS
// =========================================================================

export const BrandLogos = {
  React: () => (
    <svg className="w-4.5 h-4.5" viewBox="-11.5 -10.23174 23 20.46348">
      <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2"/>
        <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
        <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
      </g>
    </svg>
  ),
  Python: () => (
    <svg className="w-4 h-4" viewBox="0 0 110 110">
      <path fill="#387eb8" d="M54.5 5.5c-26.8 0-25.1 11.6-25.1 11.6l.03 12h25.6v3.6H19.5S5.5 31.2 5.5 58.2c0 27 12.2 26.1 12.2 26.1h7.3v-10.3s-.4-12.2 12-12.2h25.4s11.4.2 11.4-11.2V16.7S75.2 5.5 54.5 5.5zm-13.8 7.4c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5 2-4.5 4.5-4.5z"/>
      <path fill="#ffe052" d="M55.5 104.5c26.8 0 25.1-11.6 25.1-11.6l-.03-12H55v-3.6h35.5s14 1.5 14-25.5c0-27-12.2-26.1-12.2-26.1h-7.3v10.3s.4 12.2-12 12.2H47.6s-11.4-.2-11.4 11.2v33.9s-1.4 11.2 19.3 11.2zm13.8-7.4c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
    </svg>
  ),
  Docker: () => (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
      <path d="M2 13.5c0-1.5 1-2.5 2.5-2.5H6v2H4.5c-.3 0-.5.2-.5.5v1c0 .3.2.5.5.5H8v2H4.5C3 17 2 15.5 2 13.5z" fill="#2496ED"/>
      <rect x="7" y="9" width="2" height="2" fill="#2496ED" rx="0.3"/>
      <rect x="10" y="9" width="2" height="2" fill="#2496ED" rx="0.3"/>
      <rect x="13" y="9" width="2" height="2" fill="#2496ED" rx="0.3"/>
      <rect x="10" y="6" width="2" height="2" fill="#2496ED" rx="0.3"/>
      <rect x="13" y="6" width="2" height="2" fill="#2496ED" rx="0.3"/>
      <rect x="16" y="9" width="2" height="2" fill="#2496ED" rx="0.3"/>
      <path d="M22 13c-.5-.3-1.5-.4-2.2 0-.2-1.8-1.5-3.2-3.3-3.5-.2-.1-.5-.1-.7-.1v2.1c0 .3-.2.5-.5.5H6v3c0 3.5 3 6 8 6 5.5 0 8-3.5 8-8z" fill="#2496ED"/>
    </svg>
  ),
  AWS: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 12c0 2.5 1.8 4.2 4.2 4.2 1.8 0 3.2-1 3.8-2.3l-1.5-.9c-.4.8-1.3 1.4-2.3 1.4-1.5 0-2.5-1-2.5-2.4 0-1.4 1-2.4 2.5-2.4 1 0 1.9.6 2.3 1.4l1.5-.9c-.6-1.3-2-2.3-3.8-2.3-2.4 0-4.2 1.7-4.2 4.2z" fill="#FF9900"/>
      <path d="M19.5 16.5C14.5 20 8.5 20.5 3.5 18c-.4-.2-.1-.8.3-.6 4.7 2.3 10.3 1.8 15-.9.4-.3.9.3.7.0z" fill="#FF9900"/>
      <path d="M20.5 15.2c-.3-.4-1.8-.2-2.6 0-.3 0-.3-.3 0-.5 1.5-.9 3.2-.5 3.5-.2.3.4-.2 2.1-1.6 3.1-.3.2-.5.1-.4-.2.4-.6 1.4-1.8 1.1-2.2z" fill="#FF9900"/>
    </svg>
  ),
  Supabase: () => (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
      <path d="M13.4 2.1L3.9 14.2c-.5.6 0 1.5.8 1.5h7.1L10.6 21.9c-.3.8.7 1.4 1.3.7l9.5-12.1c.5-.6 0-1.5-.8-1.5h-7.1l1.2-6.2c.3-.8-.7-1.4-1.3-.7z" fill="#3ECF8E"/>
    </svg>
  ),
  GitHub: () => (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
};

export default function ArchitectureCanvas() {
  const [activeTab, setActiveTab] = useState('user');

  return (
    <div className="max-w-5xl mx-auto pt-8 w-full space-y-4">
      {/* Section Header & Segmented Controller */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
            <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
              System Architecture
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f0f6fc] tracking-tight">
            How Deployat Works
          </h2>
          <p className="text-xs sm:text-[13px] text-[#8b949e] mt-1">
            Explore the end-to-end user experience and the underlying AWS cloud compute pipeline.
          </p>
        </div>

        {/* Segmented Controller (2 Tabs) */}
        <div className="inline-flex items-center p-1 rounded-[8px] bg-[#161b22] border border-[#30363d] select-none gap-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-all duration-150 cursor-pointer ${activeTab === 'user' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'}`}
          >
            <Activity className="w-3.5 h-3.5 text-[#2ea44f]" />
            <span>1. User Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-all duration-150 cursor-pointer ${activeTab === 'engine' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'}`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#FF9900]" />
            <span>2. AWS Cloud Engine</span>
          </button>
        </div>
      </div>

      {/* Railway Dot-Grid Canvas Window */}
      <div className="bg-[#080b10] border border-[#30363d] rounded-[10px] overflow-hidden shadow-2xl relative">

        {/* Canvas Toolbar Header */}
        <div className="bg-[#161b22]/95 backdrop-blur-md border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between z-30 relative select-none">
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-[6px] p-0.5">
            <button className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors" title="Grid View">
              <Grid className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-[#30363d]"></div>
            <button className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors" title="Zoom In">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors" title="Zoom Out">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors" title="Fit to Screen">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
            <span className="text-[#c9d1d9]">
              {activeTab === 'user' && 'User Journey · Code ➔ GitHub ➔ Platform ➔ Keys ➔ Live Internet'}
              {activeTab === 'engine' && 'AWS Cloud Architecture · Ingestion ➔ Secrets ➔ EC2 Sandbox ➔ State Registry ➔ Watchdog'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b949e] px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d]">
              <RefreshCw className="w-3.5 h-3.5 text-[#2ea44f] animate-spin" style={{ animationDuration: '5s' }} />
              <span className="text-[#f0f6fc] font-medium">Live Mesh</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#ffffff] px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.15)] shadow-sm transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy</span>
            </div>
          </div>
        </div>

        {/* Canvas Body (Dot-Grid Surface - with responsive horizontal scroll support) */}
        <div className="relative w-full h-[530px] bg-[#080b10] bg-dot-grid overflow-x-auto overflow-y-hidden select-none">
          <div className="relative w-full min-w-[980px] h-full">

            {/* ================================================================= */}
            {/* VIEW 1: USER FLOW (CODE -> GITHUB -> PLATFORM -> .ENV -> LIVE)    */}
            {/* ================================================================= */}
            {activeTab === 'user' && (
              <div className="w-full h-full relative animate-fade-in">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <filter id="glow-green-dev" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-cyan-dev" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-purple-dev" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Wire 1: User Code ➔ GitHub (Vertical Up) */}
                  <path d="M 130 305 L 130 180" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 130 305 L 130 180" fill="none" stroke="#388bfd" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#58a6ff" filter="url(#glow-cyan-dev)">
                    <animateMotion dur="2.0s" repeatCount="indefinite" path="M 130 305 L 130 180" />
                  </circle>

                  {/* Wire 2: GitHub ➔ Our Platform (Horizontal) */}
                  <path d="M 230 115 L 275 115" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 230 115 L 275 115" fill="none" stroke="#2ea44f" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#2ea44f" filter="url(#glow-green-dev)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 230 115 L 275 115" />
                  </circle>

                  {/* Wire 3: Our Platform ➔ Adding Environment Variables (Horizontal) */}
                  <path d="M 480 115 L 525 115" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 480 115 L 525 115" fill="none" stroke="#bc8cff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#bc8cff" filter="url(#glow-purple-dev)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 480 115 L 525 115" />
                  </circle>

                  {/* Wire 4: Environment Variables ➔ Live on Internet (Horizontal) */}
                  <path d="M 730 115 L 770 115" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 730 115 L 770 115" fill="none" stroke="#2ea44f" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#2ea44f" filter="url(#glow-green-dev)">
                    <animateMotion dur="2.0s" repeatCount="indefinite" path="M 730 115 L 770 115" />
                  </circle>
                </svg>

                {/* Node 1: User Code (Bottom-Left) */}
                <div className="absolute left-[30px] top-[305px] w-[200px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#58a6ff] hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">User Code</h3>
                      <span className="text-[10.5px] text-[#8b949e]">Local Workspace</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#58a6ff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">git commit -m "feat"</p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#58a6ff] font-medium">● Full-Stack App</span>
                    <ArrowUp className="w-3.5 h-3.5 text-[#58a6ff] animate-bounce" />
                  </div>
                </div>

                {/* Node 2: GitHub (Top-Left) */}
                <div className="absolute left-[30px] top-[50px] w-[200px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#f0f6fc] hover:shadow-[0_0_15px_rgba(240,246,252,0.12)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 text-[#f0f6fc]">
                      <BrandLogos.GitHub />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#ffffff] transition-colors leading-tight">GitHub</h3>
                      <span className="text-[10.5px] text-[#8b949e]">Remote Repository</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#c9d1d9] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">git push origin main</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#2ea44f] font-bold">✓</span>
                    <span className="text-[#c9d1d9]">Webhook triggered</span>
                  </div>
                </div>

                {/* Node 3: Our Platform (Top Center-Left) */}
                <div className="absolute left-[275px] top-[50px] w-[205px] bg-[#161b22] border-2 border-[#2ea44f]/70 hover:border-[#2ea44f] shadow-[0_0_20px_rgba(46,164,79,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#2ea44f]/40 flex items-center justify-center text-[#2ea44f]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc]">Our Platform</h3>
                        <span className="text-[10.5px] text-[#2ea44f] font-mono font-medium">Build Engine</span>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2ea44f] animate-pulse"></span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#c9d1d9] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">docker.build --cgroup</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#2ea44f] font-bold">✓</span>
                    <span className="text-[#c9d1d9]">auto-detect runtime</span>
                  </div>
                </div>

                {/* Node 4: Adding Environment Variables (Top Center-Right) */}
                <div className="absolute left-[525px] top-[50px] w-[205px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#bc8cff] hover:shadow-[0_0_15px_rgba(188,140,255,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#bc8cff]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors leading-tight">Environment Keys</h3>
                      <span className="text-[10.5px] text-[#8b949e]">.env Secrets Injection</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#bc8cff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">API_KEY=••••••••</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#bc8cff]">🔒</span>
                    <span className="text-[#c9d1d9]">Fernet AES-128 GCM</span>
                  </div>
                </div>

                {/* Node 5: Live on Internet (Top Far-Right) */}
                <div className="absolute left-[770px] top-[50px] w-[200px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#2ea44f] hover:shadow-[0_0_20px_rgba(46,164,79,0.2)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#2ea44f]">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#2ea44f] transition-colors leading-tight">Live on Internet</h3>
                      <span className="text-[10.5px] text-[#8b949e]">Nginx Reverse Proxy</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#2ea44f] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">https://myapp.deployat.me</p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#2ea44f] font-semibold">✓ Active SSL</span>
                    <span className="text-[#484f58]">~3.2s</span>
                  </div>
                </div>

                {/* Interactive Workflow Summary Panel (Lower Canvas Area) */}
                <div className="absolute left-[275px] w-[695px] top-[240px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-[8px] p-4 sm:p-5 space-y-3 shadow-lg select-none">
                  <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#2ea44f]" />
                      <span className="text-[12.5px] font-semibold text-[#f0f6fc] font-mono">Automated End-to-End Pipeline</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-semibold">
                      0-Config Workflow
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-left pt-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#f0f6fc]">
                        <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#58a6ff]">1</span>
                        <span>Push Code</span>
                      </div>
                      <p className="text-[10.5px] text-[#8b949e] leading-relaxed">Push to GitHub repo from your IDE.</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#f0f6fc]">
                        <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#2ea44f]">2</span>
                        <span>Intake & Build</span>
                      </div>
                      <p className="text-[10.5px] text-[#8b949e] leading-relaxed">Pulls code & compiles container.</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#f0f6fc]">
                        <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#bc8cff]">3</span>
                        <span>Inject .env</span>
                      </div>
                      <p className="text-[10.5px] text-[#8b949e] leading-relaxed">Secrets decrypted & injected.</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#f0f6fc]">
                        <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#2ea44f]">4</span>
                        <span>Live Internet</span>
                      </div>
                      <p className="text-[10.5px] text-[#8b949e] leading-relaxed">Nginx routes live traffic with SSL.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 2: AWS CLOUD ENGINE (DIRECTIONAL 5-STAGE PIPELINE)           */}
            {/* ================================================================= */}
            {activeTab === 'engine' && (
              <div className="w-full h-full relative animate-fade-in">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <filter id="glow-orange-engine" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-green-engine" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-cyan-engine" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-purple-engine" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Wire 1: Stage 1 (GitHub Trigger: right edge x=240, y=115) ➔ Stage 3 (AWS Host: left edge x=380, y=210) */}
                  <path d="M 240 115 C 310 115, 310 210, 380 210" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 240 115 C 310 115, 310 210, 380 210" fill="none" stroke="#58a6ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#58a6ff" filter="url(#glow-cyan-engine)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path="M 240 115 C 310 115, 310 210, 380 210" />
                  </circle>

                  {/* Wire 2: Stage 2 (Supabase Secrets: right edge x=240, y=385) ➔ Stage 3 (AWS Host: left edge x=380, y=310) */}
                  <path d="M 240 385 C 310 385, 310 310, 380 310" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 240 385 C 310 385, 310 310, 380 310" fill="none" stroke="#3ECF8E" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#3ECF8E" filter="url(#glow-green-engine)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path="M 240 385 C 310 385, 310 310, 380 310" />
                  </circle>

                  {/* Wire 3: Stage 3 (AWS Host: right edge x=620, y=210) ➔ Stage 4 (State Mesh: left edge x=760, y=115) */}
                  <path d="M 620 210 C 690 210, 690 115, 760 115" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 620 210 C 690 210, 690 115, 760 115" fill="none" stroke="#FF9900" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#FF9900" filter="url(#glow-orange-engine)">
                    <animateMotion dur="2.3s" repeatCount="indefinite" path="M 620 210 C 690 210, 690 115, 760 115" />
                  </circle>

                  {/* Wire 4: Stage 3 (AWS Host: right edge x=620, y=310) ➔ Stage 5 (Watchdog: left edge x=760, y=385) */}
                  <path d="M 620 310 C 690 310, 690 385, 760 385" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 620 310 C 690 310, 690 385, 760 385" fill="none" stroke="#bc8cff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4.5" fill="#bc8cff" filter="url(#glow-purple-engine)">
                    <animateMotion dur="2.7s" repeatCount="indefinite" path="M 620 310 C 690 310, 690 385, 760 385" />
                  </circle>
                </svg>

                {/* STAGE 1: INGESTION & TRIGGER (Top-Left: left 30px, width 210px -> right edge 240px) */}
                <div className="absolute left-[30px] top-[50px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#58a6ff] hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 text-[#f0f6fc]">
                        <BrandLogos.GitHub />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">Stage 1: Ingestion</h3>
                        <span className="text-[10.5px] text-[#8b949e]">GitHub Webhooks</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-bold">01</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#c9d1d9] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">HMAC-SHA256 validated</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#58a6ff] font-bold">✓</span>
                    <span className="text-[#c9d1d9]">Push & PR Triggers</span>
                  </div>
                </div>

                {/* STAGE 2: CONTROL PLANE & SECURITY (Bottom-Left: left 30px, width 210px -> right edge 240px) */}
                <div className="absolute left-[30px] top-[320px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#3ECF8E] hover:shadow-[0_0_15px_rgba(62,207,142,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                        <BrandLogos.Supabase />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#3ECF8E] transition-colors leading-tight">Stage 2: Control Plane</h3>
                        <span className="text-[10.5px] text-[#8b949e]">Supabase Secrets</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-bold">02</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#c9d1d9] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">Fernet AES-128 keys</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#3ECF8E]">🔒</span>
                    <span className="text-[#c9d1d9]">User Auth & Env State</span>
                  </div>
                </div>

                {/* STAGE 3: COMPUTE & SANDBOX ENGINE (HERO / FOCAL ANCHOR CARD - CENTER: left 380px, width 240px -> right edge 620px) */}
                <div className="absolute left-[380px] top-[145px] w-[240px] bg-[#161b22] border-2 border-[#FF9900]/80 hover:border-[#FF9900] shadow-[0_0_25px_rgba(255,153,0,0.18)] rounded-[10px] p-4 space-y-3 z-20 cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between border-b border-[#30363d]/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[6px] bg-[#0d1117] border border-[#FF9900]/40 flex items-center justify-center p-1">
                        <BrandLogos.AWS />
                      </div>
                      <div>
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#FF9900] font-bold block">Stage 03 · Core</span>
                        <h3 className="text-[14px] font-bold text-[#f0f6fc]">AWS EC2 Host</h3>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2ea44f] animate-pulse"></span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono bg-[#0d1117] px-2.5 py-1.5 rounded border border-[#30363d]">
                      <div className="flex items-center gap-1.5">
                        <BrandLogos.Docker />
                        <span className="text-[#c9d1d9]">Docker Engine</span>
                      </div>
                      <span className="text-[#2496ED] font-bold">cgroups v2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-center">
                      <div className="bg-[#21262d] px-2 py-1.5 rounded border border-[#30363d] text-[#f0f6fc]">
                        <span className="text-[#8b949e] block text-[8.5px] font-semibold">MEM CAP</span>
                        <span className="font-bold text-[#58a6ff]">128 MB</span>
                      </div>
                      <div className="bg-[#21262d] px-2 py-1.5 rounded border border-[#30363d] text-[#f0f6fc]">
                        <span className="text-[#8b949e] block text-[8.5px] font-semibold">CPU LIMIT</span>
                        <span className="font-bold text-[#FF9900]">25% Cap</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] pt-1 border-t border-[#30363d]/60">
                    <span className="text-[#2ea44f] font-semibold">✓ Isolated Sandbox</span>
                    <span className="text-[#c9d1d9]">Multi-Stage</span>
                  </div>
                </div>

                {/* STAGE 4: LIVE MESH & STATE REGISTRY (Top-Right: left 760px, width 210px -> left edge 760px) */}
                <div className="absolute left-[760px] top-[50px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#58a6ff] hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 text-[#58a6ff]">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">Stage 4: State Mesh</h3>
                        <span className="text-[10.5px] text-[#8b949e]">Routing Gateway</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-bold">04</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#c9d1d9] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">status: RUNNING / SLEEPING</p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#2ea44f] font-semibold">✓ Port Mapping</span>
                    <span className="text-[#58a6ff] font-bold">:49203</span>
                  </div>
                </div>

                {/* STAGE 5: RESOURCE OPTIMIZER / WATCHDOG (Bottom-Right: left 760px, width 210px -> left edge 760px) */}
                <div className="absolute left-[760px] top-[320px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#bc8cff] hover:shadow-[0_0_15px_rgba(188,140,255,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 text-[#bc8cff]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors leading-tight">Stage 5: Watchdog</h3>
                        <span className="text-[10.5px] text-[#8b949e]">Resource Optimizer</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-bold">05</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#bc8cff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">0MB RAM when idle</p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#2ea44f] font-semibold">⚡ Instant Wake</span>
                    <span className="text-[#c9d1d9] font-bold">&lt;1.0s</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Canvas Bottom Status Bar */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2.5 flex items-center justify-between text-[10.5px] font-mono text-[#484f58] select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f]"></span>
              <span className="text-[#c9d1d9] font-medium">AWS EC2 Container Host + Supabase Control Plane</span>
            </span>
            <span className="hidden sm:inline text-[#30363d]">|</span>
            <span className="hidden sm:inline text-[#8b949e]">Sequential directional pipeline · Zero DevOps configuration</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8b949e]">Sandbox: <strong className="text-[#f0f6fc]">128MB Cap</strong></span>
            <span className="text-[#2ea44f] font-semibold">SSL: Active ✓</span>
          </div>
        </div>

      </div>
    </div>
  );
}