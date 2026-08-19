import React, { useState } from 'react';
import { 
  Activity, Network, Server, Cpu, Globe, Database, 
  Lock, HardDrive, Plus, Minus, Maximize2, RefreshCw, 
  Grid, ShieldCheck, Zap, Cloud, Laptop, Layers, ArrowRight
} from 'lucide-react';

// =========================================================================
// OFFICIAL BRAND VECTOR LOGOS
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
  Go: () => (
    <svg className="w-4.5 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M1.8 10.2c-.1-.3-.1-.6-.1-.9 0-4.2 3.6-7.7 8.1-7.7 3.3 0 6.2 1.9 7.4 4.5l-2.7 1.3c-.8-1.6-2.5-2.6-4.6-2.6-2.8 0-5.1 2.1-5.2 4.7h6.6v3.2H4.7c.1 2.6 2.4 4.7 5.2 4.7 2.1 0 3.8-1.1 4.6-2.6l2.7 1.3c-1.2 2.7-4.1 4.5-7.4 4.5-4.5 0-8.1-3.5-8.1-7.7 0-.3 0-.6.1-.9zM18.8 8.4h3.5v3.2h-3.5V8.4zm0 5.1h3.5v3.2h-3.5v-3.2z" fill="#00ADD8"/>
    </svg>
  ),
  Postgres: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C7.8 2 4.1 4.9 3.2 9c-.4 1.9-.3 3.7.4 5.5.5 1.3 1.3 2.3 2.2 3.2v3.4c0 .6.4 1 1 1h3c.6 0 1-.4 1-1v-1.9c.4.1.8.1 1.2.1 2.2 0 4.2-1 5.6-2.7 1.5-1.8 2.2-4.2 2-6.6-.4-4.3-3.9-7.9-7.6-7.9z" fill="#336791"/>
      <circle cx="9.5" cy="8.5" r="1" fill="#ffffff"/>
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
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 12c0 2.5 1.8 4.2 4.2 4.2 1.8 0 3.2-1 3.8-2.3l-1.5-.9c-.4.8-1.3 1.4-2.3 1.4-1.5 0-2.5-1-2.5-2.4 0-1.4 1-2.4 2.5-2.4 1 0 1.9.6 2.3 1.4l1.5-.9c-.6-1.3-2-2.3-3.8-2.3-2.4 0-4.2 1.7-4.2 4.2z" fill="#FF9900"/>
      <path d="M19.5 16.5C14.5 20 8.5 20.5 3.5 18c-.4-.2-.1-.8.3-.6 4.7 2.3 10.3 1.8 15-.9.4-.3.9.3.7.0z" fill="#FF9900"/>
      <path d="M20.5 15.2c-.3-.4-1.8-.2-2.6 0-.3 0-.3-.3 0-.5 1.5-.9 3.2-.5 3.5-.2.3.4-.2 2.1-1.6 3.1-.3.2-.5.1-.4-.2.4-.6 1.4-1.8 1.1-2.2z" fill="#FF9900"/>
    </svg>
  ),
  Supabase: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M13.4 2.1L3.9 14.2c-.5.6 0 1.5.8 1.5h7.1L10.6 21.9c-.3.8.7 1.4 1.3.7l9.5-12.1c.5-.6 0-1.5-.8-1.5h-7.1l1.2-6.2c.3-.8-.7-1.4-1.3-.7z" fill="#3ECF8E"/>
    </svg>
  ),
  GitHub: () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  Nginx: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7.8v8.4L12 22l10-5.8V7.8L12 2zm6 12.8L12 8.7v6.1H9.8V9.2L16 15.3v-6.1h2.2v6.6z" fill="#009639"/>
    </svg>
  ),
};

export default function ArchitectureCanvas() {
  const [activeTab, setActiveTab] = useState('developer');

  return (
    <div className="max-w-5xl mx-auto pt-8 w-full space-y-4">
      {/* Section Header & Segmented Controller */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
              System Architecture
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f0f6fc] tracking-tight">
            How Deployat Works
          </h2>
          <p className="text-xs text-[#8b949e] mt-1">
            Explore developer workflows, live request routing, and AWS container orchestration.
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-[8px] bg-[#161b22] border border-[#30363d] select-none flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('developer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${activeTab === 'developer' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'}`}
          >
            <Activity className="w-3.5 h-3.5 text-[#2ea44f]" />
            <span>1. Developer Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${activeTab === 'routing' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'}`}
          >
            <Network className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>2. Live Request Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${activeTab === 'engine' ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'}`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#FF9900]" />
            <span>3. AWS Cloud Engine</span>
          </button>
        </div>
      </div>

      {/* Railway Dot-Grid Canvas Window */}
      <div className="bg-[#0b0e14] border border-[#30363d] rounded-[8px] overflow-hidden shadow-2xl relative">

        {/* Canvas Toolbar Header */}
        <div className="bg-[#161b22]/90 backdrop-blur border-b border-[#30363d] px-4 py-2 flex items-center justify-between z-30 relative select-none">
          <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-[6px] p-0.5">
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
            <span>
              {activeTab === 'developer' && 'Developer Experience · Git push to live SSL'}
              {activeTab === 'routing' && 'End-User Routing · Gateway ➔ Container ➔ DB'}
              {activeTab === 'engine' && 'AWS Cloud Core · EC2 cgroups + Supabase Auth'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#8b949e] px-2 py-1 rounded bg-[#0d1117] border border-[#30363d]">
              <RefreshCw className="w-3 h-3 text-[#2ea44f] animate-spin" style={{ animationDuration: '5s' }} />
              <span>Live Mesh</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#f0f6fc] px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] transition-colors cursor-pointer">
              <Plus className="w-3 h-3" />
              <span>Deploy</span>
            </div>
          </div>
        </div>

        {/* Canvas Body (Dot-Grid Surface) */}
        <div className="relative w-full h-[520px] bg-[#0b0e14] bg-dot-grid overflow-hidden">

          {/* VIEW 1: DEVELOPER FLOW */}
          {activeTab === 'developer' && (
            <div className="w-full h-full relative animate-fade-in">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <filter id="glow-green-dev" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-cyan-dev" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <path d="M 230 110 C 285 110, 285 240, 340 240" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 230 110 C 285 110, 285 240, 340 240" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#2ea44f" filter="url(#glow-green-dev)">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M 230 110 C 285 110, 285 240, 340 240" />
                </circle>
                <path d="M 230 380 C 285 380, 285 280, 340 280" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 230 380 C 285 380, 285 280, 340 280" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#58a6ff" filter="url(#glow-cyan-dev)">
                  <animateMotion dur="2.6s" repeatCount="indefinite" path="M 230 380 C 285 380, 285 280, 340 280" />
                </circle>
                <path d="M 550 240 C 605 240, 605 110, 660 110" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 550 240 C 605 240, 605 110, 660 110" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#2ea44f" filter="url(#glow-green-dev)">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M 550 240 C 605 240, 605 110, 660 110" />
                </circle>
                <path d="M 550 280 C 605 280, 605 380, 660 380" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 550 280 C 605 280, 605 380, 660 380" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#58a6ff" filter="url(#glow-cyan-dev)">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M 550 280 C 605 280, 605 380, 660 380" />
                </circle>
              </svg>

              {/* Node 1: Frontend Repo */}
              <div className="absolute left-6 sm:left-10 top-[60px] w-[185px] sm:w-[195px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#61dafb] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                    <BrandLogos.React />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#61dafb] transition-colors leading-tight">Frontend Repo</h3>
                    <span className="text-[10px] text-[#8b949e]">React / Next.js</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">github.com/org/client-ui</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓</span>
                  <span>git push origin main</span>
                </div>
              </div>

              {/* Node 2: Backend Repo */}
              <div className="absolute left-6 sm:left-10 top-[330px] w-[185px] sm:w-[195px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#387eb8] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                    <BrandLogos.Python />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">Backend API Repo</h3>
                    <span className="text-[10px] text-[#8b949e]">Python / Node.js</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">github.com/org/backend-api</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓</span>
                  <span>git push origin main</span>
                </div>
              </div>

              {/* Node 3: Deployat Cloud Platform */}
              <div className="absolute left-[36%] sm:left-[38%] top-[190px] w-[200px] sm:w-[210px] bg-[#161b22] border-2 border-[#2ea44f]/60 hover:border-[#2ea44f] rounded-[8px] p-4 space-y-3 z-10 shadow-xl cursor-pointer group transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#2ea44f]/40 flex items-center justify-center text-[#2ea44f]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#f0f6fc]">Deployat Cloud</h3>
                      <span className="text-[10px] text-[#2ea44f] font-mono">Intake Engine</span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">
                  Catches commits, generates Docker containers, and assigns public routes.
                </p>
                <div className="text-[10px] font-mono text-[#8b949e] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                  automated intake & build
                </div>
              </div>

              {/* Node 4: Live Frontend URL */}
              <div className="absolute right-6 sm:right-10 top-[60px] w-[185px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#2ea44f] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#2ea44f]">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#2ea44f] transition-colors leading-tight">Web Application</h3>
                    <span className="text-[10px] text-[#8b949e]">Live on Edge</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#2ea44f] truncate">https://app.deployat.me</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Active SSL</span>
                  <span className="text-[#484f58]">:3000</span>
                </div>
              </div>

              {/* Node 5: Live API URL */}
              <div className="absolute right-6 sm:right-10 top-[330px] w-[185px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#58a6ff] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">Live REST API</h3>
                    <span className="text-[10px] text-[#8b949e]">Backend Routes</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#58a6ff] truncate">https://api.deployat.me</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Active SSL</span>
                  <span className="text-[#484f58]">:8000</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: LIVE REQUEST ROUTING */}
          {activeTab === 'routing' && (
            <div className="w-full h-full relative animate-fade-in">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <filter id="glow-cyan-route" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <path d="M 230 260 C 285 260, 285 120, 340 120 L 530 120 C 585 120, 585 380, 660 380" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 230 260 C 285 260, 285 120, 340 120 L 530 120 C 585 120, 585 380, 660 380" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#58a6ff" filter="url(#glow-cyan-route)">
                  <animateMotion dur="3.0s" repeatCount="indefinite" path="M 230 260 C 285 260, 285 120, 340 120 L 530 120 C 585 120, 585 380, 660 380" />
                </circle>
              </svg>

              {/* Node 1: End-User Browser */}
              <div className="absolute left-6 sm:left-10 top-[200px] w-[185px] sm:w-[195px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#58a6ff] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                    <Laptop className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">End-User Browser</h3>
                    <span className="text-[10px] text-[#8b949e]">Client Request</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#58a6ff] truncate">GET /api/products</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">● HTTPS Request</span>
                </div>
              </div>

              {/* Node 2: Deployat Edge Gateway */}
              <div className="absolute left-[35%] sm:left-[37%] top-[70px] w-[195px] sm:w-[210px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#009639] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                    <BrandLogos.Nginx />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#2ea44f] transition-colors leading-tight">Edge Gateway (Nginx)</h3>
                    <span className="text-[10px] text-[#8b949e]">Reverse Proxy</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">Discovers active port</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Match Hostname</span>
                  <span className="text-[#484f58]">:49203</span>
                </div>
              </div>

              {/* Node 3: Docker Container on AWS */}
              <div className="absolute left-[35%] sm:left-[37%] top-[330px] w-[195px] sm:w-[210px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#2496ED] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                      <BrandLogos.Docker />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#2496ED] transition-colors leading-tight">App Container</h3>
                      <span className="text-[10px] text-[#8b949e]">Docker on AWS</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">128MB</span>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">FastAPI / Node execution</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Sandboxed cgroup</span>
                  <span className="text-[#484f58]">25% CPU</span>
                </div>
              </div>

              {/* Node 4: PostgreSQL Database */}
              <div className="absolute right-6 sm:right-10 top-[330px] w-[185px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#336791] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                    <BrandLogos.Postgres />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">PostgreSQL DB</h3>
                    <span className="text-[10px] text-[#8b949e]">Supabase Database</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">SELECT * FROM products</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Private query</span>
                  <span className="text-[#484f58]">12ms</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: PLATFORM ENGINE & CLOUD */}
          {activeTab === 'engine' && (
            <div className="w-full h-full relative animate-fade-in">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <filter id="glow-orange-engine" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-green-supa" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <path d="M 230 110 C 285 110, 285 240, 340 240" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 230 110 C 285 110, 285 240, 340 240" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#3ECF8E" filter="url(#glow-green-supa)">
                  <animateMotion dur="2.6s" repeatCount="indefinite" path="M 230 110 C 285 110, 285 240, 340 240" />
                </circle>
                <path d="M 230 380 C 285 380, 285 280, 340 280" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 230 380 C 285 380, 285 280, 340 280" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#ffffff">
                  <animateMotion dur="3.0s" repeatCount="indefinite" path="M 230 380 C 285 380, 285 280, 340 280" />
                </circle>
                <path d="M 550 240 C 605 240, 605 110, 660 110" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 550 240 C 605 240, 605 110, 660 110" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#FF9900" filter="url(#glow-orange-engine)">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M 550 240 C 605 240, 605 110, 660 110" />
                </circle>
                <path d="M 550 280 C 605 280, 605 380, 660 380" fill="none" stroke="#21262d" strokeWidth="2" />
                <path d="M 550 280 C 605 280, 605 380, 660 380" fill="none" stroke="#30363d" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="4" fill="#bc8cff">
                  <animateMotion dur="2.8s" repeatCount="indefinite" path="M 550 280 C 605 280, 605 380, 660 380" />
                </circle>
              </svg>

              {/* Node 1: Supabase Auth & User DB */}
              <div className="absolute left-6 sm:left-10 top-[60px] w-[185px] sm:w-[195px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#3ECF8E] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1">
                    <BrandLogos.Supabase />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#3ECF8E] transition-colors leading-tight">Supabase DB</h3>
                    <span className="text-[10px] text-[#8b949e]">Auth & .env Secrets</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">Fernet AES-128 keys</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#3ECF8E]">✓ User Auth & Tokens</span>
                </div>
              </div>

              {/* Node 2: GitHub Webhooks */}
              <div className="absolute left-6 sm:left-10 top-[330px] w-[185px] sm:w-[195px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#8b949e] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 text-[#f0f6fc]">
                    <BrandLogos.GitHub />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">GitHub Webhooks</h3>
                    <span className="text-[10px] text-[#8b949e]">CI/CD Intake</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">Push & PR triggers</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ HMAC SHA-256</span>
                </div>
              </div>

              {/* Node 3: AWS Cloud Container Host */}
              <div className="absolute left-[35%] sm:left-[37%] top-[180px] w-[205px] sm:w-[220px] bg-[#161b22] border-2 border-[#FF9900]/60 hover:border-[#FF9900] rounded-[8px] p-4 space-y-3 z-10 shadow-xl cursor-pointer group transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#FF9900]/40 flex items-center justify-center p-1">
                      <BrandLogos.AWS />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#f0f6fc]">AWS EC2 Host</h3>
                      <span className="text-[10px] text-[#FF9900] font-mono">Docker Engine</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">cgroups v2</span>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">
                  Builds and runs isolated Docker containers with 128MB RAM caps and 25% CPU throttle.
                </p>
                <div className="text-[10px] font-mono text-[#8b949e] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] flex items-center justify-between">
                  <span>Containers Host</span>
                  <span className="text-[#2ea44f]">online</span>
                </div>
              </div>

              {/* Node 4: Container State Registry */}
              <div className="absolute right-6 sm:right-10 top-[60px] w-[185px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#58a6ff] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">State Registry</h3>
                    <span className="text-[10px] text-[#8b949e]">Supabase Projects</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#8b949e] truncate">status: RUNNING / SLEEPING</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Port Mapping</span>
                  <span className="text-[#484f58]">:49203</span>
                </div>
              </div>

              {/* Node 5: Auto-Sleep Watchdog */}
              <div className="absolute right-6 sm:right-10 top-[330px] w-[185px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#bc8cff] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#bc8cff]">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors leading-tight">Sleep Watchdog</h3>
                    <span className="text-[10px] text-[#8b949e]">Memory Saver</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-[#bc8cff] truncate">Idle ➔ Sleep ➔ Instant Wake</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                  <span className="text-[#2ea44f]">✓ Cost optimizer</span>
                  <span className="text-[#484f58]">0MB idle</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Canvas Bottom Status Bar */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2.5 flex items-center justify-between text-[10px] font-mono text-[#484f58] select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f]"></span>
              <span className="text-[#8b949e]">AWS EC2 Host + Supabase Cloud</span>
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline text-[#8b949e]">Isolated cgroups v2 sandbox with automated Nginx reverse proxy</span>
          </div>
          <div className="flex items-center gap-3">
            <span>RAM: 128MB Cap</span>
            <span>SSL: Active ✓</span>
          </div>
        </div>

      </div>
    </div>
  );
}