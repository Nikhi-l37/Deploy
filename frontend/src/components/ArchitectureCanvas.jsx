import React, { useState } from 'react';
import { 
  Activity, Globe, Database, Lock, Plus, Minus, 
  Maximize2, RefreshCw, Grid, Cloud, FileCode, 
  Terminal, ArrowUp, Network, Server, Zap, Shield 
} from 'lucide-react';

// =========================================================================
// HIGH-PRECISION OFFICIAL BRAND VECTOR LOGOS
// =========================================================================

export const BrandLogos = {
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
    <svg className="w-7 h-4.5" viewBox="0 0 44 26" fill="none">
      {/* Crisp Official Amazon Web Services Typography */}
      <text x="1" y="15" fill="#f0f6fc" fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="15.5" letterSpacing="-0.8">aws</text>
      {/* Signature Amazon #FF9900 Smile Arrow */}
      <path d="M3.5 19 C 12 24, 27 24, 37 17.5" stroke="#FF9900" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M34 15.5 L 39 17.5 L 35 20.5 Z" fill="#FF9900"/>
    </svg>
  ),
  Watchdog: () => (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#bc8cff" strokeWidth="1.8" />
      <path d="M12 6v6l4 2.5" stroke="#bc8cff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="#2ea44f" />
      <path d="M7 17l2-2M17 17l-2-2" stroke="#bc8cff" strokeWidth="1.5" strokeLinecap="round" />
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
      <div className="bg-[#161b22] border border-[#30363d] rounded-[10px] overflow-hidden shadow-2xl relative">

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
              {activeTab === 'user' && 'User Journey · Code ➔ GitHub ➔ Platform ➔ Live Internet'}
              {activeTab === 'engine' && 'Internal Engine · Code Push ➔ Smart Queue ➔ Auto-Build ➔ Live Container ➔ Smart Sleep/Wake'}
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

        {/* Canvas Body (Dot-Grid Surface - uniform h-[440px] for zero layout shift) */}
        <div className="relative w-full h-[440px] bg-[#080b10] bg-dot-grid overflow-hidden select-none">
          <div className="relative w-full h-full">

            {/* ================================================================= */}
            {/* VIEW 1: USER FLOW (DEVELOPER JOURNEY & VISITOR EXPERIENCE)        */}
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

                  {/* Wire 1: User Code ➔ GitHub */}
                  <path d="M 240 111 L 275 111" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 240 111 L 275 111" fill="none" stroke="#388bfd" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#58a6ff" filter="url(#glow-cyan-dev)">
                    <animateMotion dur="2.0s" repeatCount="indefinite" path="M 240 111 L 275 111" />
                  </circle>

                  {/* Wire 2: GitHub ➔ Deployat Engine */}
                  <path d="M 485 111 L 520 111" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 485 111 L 520 111" fill="none" stroke="#bc8cff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#bc8cff" filter="url(#glow-purple-dev)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 485 111 L 520 111" />
                  </circle>

                  {/* Wire 3: Deployat Engine ➔ Live on Internet */}
                  <path d="M 745 111 L 780 111" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 745 111 L 780 111" fill="none" stroke="#2ea44f" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#2ea44f" filter="url(#glow-green-dev)">
                    <animateMotion dur="2.0s" repeatCount="indefinite" path="M 745 111 L 780 111" />
                  </circle>

                  {/* Vertical Wire: Live on Internet ➔ Production Serving */}
                  <path d="M 885 178 L 885 232" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 885 178 L 885 232" fill="none" stroke="#2ea44f" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#2ea44f" filter="url(#glow-green-dev)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M 885 178 L 885 232" />
                  </circle>

                  {/* Wire 5: Serving ➔ Global Visitor (Going Left) */}
                  <path d="M 542 302 L 480 302" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 542 302 L 480 302" fill="none" stroke="#388bfd" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#58a6ff" filter="url(#glow-cyan-dev)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 542 302 L 480 302" />
                  </circle>
                </svg>

                {/* Floating Bridge Badge on Vertical Drop */}
                <div className="absolute left-[885px] top-[198px] -translate-x-1/2 z-20 pointer-events-none flex items-center gap-1.5 text-[9px] font-mono bg-[#0d1117] text-[#2ea44f] px-2.5 py-0.5 rounded-full border border-[#2ea44f]/40 shadow-lg select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f] animate-pulse"></span>
                  <span>Live Globally ➔</span>
                </div>

                {/* ============================================================= */}
                {/* SECTION 1: DEVELOPER DEPLOYMENT JOURNEY (TOP ROW)             */}
                {/* ============================================================= */}
                <div className="absolute left-[30px] top-[14px] w-[962px] flex items-center justify-between border-b border-[#30363d]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#f0f6fc]">
                      Stage 1 · Developer Deployment Journey
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-semibold">
                    Zero-DevOps
                  </span>
                </div>

                {/* Node 1: User Code */}
                <div className="absolute left-[30px] top-[44px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#58a6ff] hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">User Code</h3>
                        <span className="text-[10px] text-[#8b949e]">Local Workspace</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold">01</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#58a6ff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">git commit -m "feat"</p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#58a6ff] font-bold">●</span>
                      <span className="text-[#c9d1d9]">Full-Stack App</span>
                    </div>
                    <span className="text-[#8b949e]">Local IDE</span>
                  </div>
                </div>

                {/* Node 2: GitHub */}
                <div className="absolute left-[275px] top-[44px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#f0f6fc] hover:shadow-[0_0_15px_rgba(240,246,252,0.12)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 text-[#f0f6fc]">
                        <BrandLogos.GitHub />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#ffffff] transition-colors leading-tight">GitHub</h3>
                        <span className="text-[10px] text-[#8b949e]">Remote Repository</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-bold">02</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#c9d1d9] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">git push origin main</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <span className="text-[#2ea44f] font-bold">✓</span>
                    <span className="text-[#c9d1d9]">Webhook triggered</span>
                  </div>
                </div>

                {/* Node 3: Deployat Engine */}
                <div className="absolute left-[520px] top-[44px] w-[225px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#bc8cff] hover:shadow-[0_0_20px_rgba(188,140,255,0.2)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#bc8cff]/40 flex items-center justify-center text-[#bc8cff] transition-colors">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors leading-tight">Deployat Engine</h3>
                        <span className="text-[10px] text-[#8b949e]">Build · Secrets · Container</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#bc8cff] border border-[#30363d] font-bold">03</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#bc8cff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">docker.build --cgroup</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-[#f85149] bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                      <Lock className="w-3 h-3" /> .env encrypted
                    </span>
                    <span className="flex items-center gap-1 text-[#8b949e]">
                      <span className="text-[#bc8cff] font-bold">✓</span> auto-detect
                    </span>
                  </div>
                </div>

                {/* Node 4: Live on Internet */}
                <div className="absolute left-[780px] top-[44px] w-[210px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#2ea44f] hover:shadow-[0_0_20px_rgba(46,164,79,0.2)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#2ea44f]/40 flex items-center justify-center text-[#2ea44f] transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#2ea44f] transition-colors leading-tight">Live on Internet</h3>
                        <span className="text-[10px] text-[#8b949e]">Nginx Reverse Proxy</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-bold">04</span>
                  </div>
                  <p className="text-[10.5px] font-mono text-[#2ea44f] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate">https://myapp.deployat.me</p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#2ea44f] font-bold">✓</span>
                      <span className="text-[#c9d1d9]">Active SSL</span>
                    </div>
                    <span className="text-[#484f58]">~3.2s</span>
                  </div>
                </div>

                {/* ============================================================= */}
                {/* SECTION 2: LIVE VISITOR TRAFFIC & GLOBAL ROUTING (BOTTOM ROW) */}
                {/* ============================================================= */}
                <div className="absolute left-[30px] top-[204px] w-[962px] flex items-center justify-between border-b border-[#30363d]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#f0f6fc]">
                      Stage 2 · Live Visitor Experience & Global Routing
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-semibold">
                    &lt;50ms Edge
                  </span>
                </div>

                {/* Card A: Global Visitor Access */}
                <div className="absolute left-[30px] top-[232px] w-[450px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#388bfd] hover:shadow-[0_0_15px_rgba(56,139,253,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#388bfd]/40 flex items-center justify-center p-1 text-[#388bfd] transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#388bfd] transition-colors leading-tight">Global Visitor Access</h3>
                        <span className="text-[10px] text-[#8b949e]">Instant Worldwide Edge Delivery</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#388bfd] border border-[#30363d] font-bold">● Ultra-Fast</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">DNS RESOLVE</span>
                      <span className="font-bold text-[#388bfd]">&lt; 15ms</span>
                    </div>
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">SSL HANDSHAKE</span>
                      <span className="font-bold text-[#2ea44f]">&lt; 20ms</span>
                    </div>
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">FIRST BYTE</span>
                      <span className="font-bold text-[#FF9900]">&lt; 45ms</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-1.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#388bfd]" />
                      <span className="text-[#c9d1d9]">Direct Nginx reverse-proxy</span>
                    </div>
                    <span className="text-[#388bfd]">Global CDN</span>
                  </div>
                </div>

                {/* Card B: Zero-Config Production Serving */}
                <div className="absolute left-[542px] top-[232px] w-[450px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#2ea44f] hover:shadow-[0_0_15px_rgba(46,164,79,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#2ea44f]/40 flex items-center justify-center p-1 text-[#2ea44f] transition-colors">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#2ea44f] transition-colors leading-tight">Zero-Config Production Serving</h3>
                        <span className="text-[10px] text-[#8b949e]">Isolated Sandbox & Automatic HTTPS</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-bold">● Active</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">RAM ISOLATION</span>
                      <span className="font-bold text-[#2ea44f]">512MB Cap</span>
                    </div>
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">SSL CERT</span>
                      <span className="font-bold text-[#388bfd]">Auto Let's Encrypt</span>
                    </div>
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">UPTIME GUARD</span>
                      <span className="font-bold text-[#FF9900]">Auto-Restart</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-1.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#2ea44f] font-bold">✓</span>
                      <span className="text-[#c9d1d9]">Free custom domain support</span>
                    </div>
                    <span className="text-[#2ea44f]">Zero Downtime</span>
                  </div>
                </div>

                {/* Bottom Status Badge */}
                <div className="absolute left-[511px] top-[388px] -translate-x-1/2 z-10 pointer-events-none flex items-center gap-1.5 text-[9.5px] font-mono bg-[#0d1117] text-[#2ea44f] px-3 py-1 rounded-full border border-[#30363d] shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f] animate-ping"></span>
                  <span>⚡ Zero configuration required · Push to git and your site is live worldwide</span>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* VIEW 2: AWS CLOUD ENGINE (2-TIER OPTIMIZED ARCHITECTURE)          */}
            {/* ================================================================= */}
            {activeTab === 'engine' && (
              <div className="w-full h-full relative animate-fade-in">

                {/* SVG Connecting Wires */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <filter id="glow-cyan-pipe" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-orange-pipe" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-purple-pipe" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-green-pipe" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Wire 1 (Row 1: Card 1 -> Card 2) */}
                  <path d="M 324 111 L 364 111" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 324 111 L 364 111" fill="none" stroke="#58a6ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#58a6ff" filter="url(#glow-cyan-pipe)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 324 111 L 364 111" />
                  </circle>

                  {/* Wire 2 (Row 1: Card 2 -> Card 3) */}
                  <path d="M 658 111 L 698 111" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 658 111 L 698 111" fill="none" stroke="#FF9900" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#FF9900" filter="url(#glow-orange-pipe)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 658 111 L 698 111" />
                  </circle>

                  {/* Wire 3 (Vertical Bridge: Card 3 -> Card 4) */}
                  <path d="M 845 178 L 845 232" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 845 178 L 845 232" fill="none" stroke="#bc8cff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#bc8cff" filter="url(#glow-purple-pipe)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M 845 178 L 845 232" />
                  </circle>

                  {/* Wire 4 (Row 2: Card 4 -> Card 5 going Left) */}
                  <path d="M 542 302 L 480 302" fill="none" stroke="#21262d" strokeWidth="3" />
                  <path d="M 542 302 L 480 302" fill="none" stroke="#2ea44f" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle r="4" fill="#2ea44f" filter="url(#glow-green-pipe)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 542 302 L 480 302" />
                  </circle>

                  {/* Wire 5 (Return Loop: Card 5 -> Card 4 Traffic Wake) */}
                  <path d="M 255 372 C 255 408, 767 408, 767 372" fill="none" stroke="#21262d" strokeWidth="2.5" />
                  <path d="M 255 372 C 255 408, 767 408, 767 372" fill="none" stroke="#388bfd" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle r="3.5" fill="#58a6ff" filter="url(#glow-cyan-pipe)">
                    <animateMotion dur="3.0s" repeatCount="indefinite" path="M 255 372 C 255 408, 767 408, 767 372" />
                  </circle>
                </svg>

                {/* Floating Bridge Badge on Vertical Wire */}
                <div className="absolute left-[845px] top-[198px] -translate-x-1/2 z-20 pointer-events-none flex items-center gap-1.5 text-[9px] font-mono bg-[#0d1117] text-[#bc8cff] px-2.5 py-0.5 rounded-full border border-[#bc8cff]/40 shadow-lg select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bc8cff] animate-pulse"></span>
                  <span>Deploys Live ➔</span>
                </div>

                {/* ============================================================= */}
                {/* SECTION 1: PHASE 1 · BUILD & PACKAGING PIPELINE (TOP ROW)     */}
                {/* ============================================================= */}
                <div className="absolute left-[30px] top-[14px] w-[962px] flex items-center justify-between border-b border-[#30363d]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#f0f6fc]">
                      Phase 1 · Build & Packaging Pipeline
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-semibold">
                    Zero-DevOps
                  </span>
                </div>

                {/* CARD 1: SECURE CODE PUSH */}
                <div className="absolute left-[30px] top-[44px] w-[294px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#58a6ff] hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#58a6ff]/40 flex items-center justify-center p-1 text-[#f0f6fc] transition-colors">
                        <BrandLogos.GitHub />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors leading-tight">1. Secure Code Push</h3>
                        <span className="text-[10px] text-[#8b949e]">Automatic GitHub Delivery</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold">01</span>
                  </div>
                  <p className="text-[10.5px] text-[#8b949e] leading-relaxed">
                    Safely receives your code directly whenever you push to your repository.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-[#58a6ff]" />
                      <span className="text-[#c9d1d9]">Verified Push</span>
                    </div>
                    <span className="text-[#58a6ff] font-semibold">Zero-Config</span>
                  </div>
                </div>

                {/* CARD 2: SMART BUILD QUEUE */}
                <div className="absolute left-[364px] top-[44px] w-[294px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#FF9900] hover:shadow-[0_0_15px_rgba(255,153,0,0.15)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#FF9900]/40 flex items-center justify-center p-1 text-[#FF9900] transition-colors">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#FF9900] transition-colors leading-tight">2. Smart Build Queue</h3>
                        <span className="text-[10px] text-[#8b949e]">Instant Job Scheduling</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#FF9900] border border-[#30363d] font-bold">02</span>
                  </div>
                  <p className="text-[10.5px] text-[#8b949e] leading-relaxed">
                    Queues and dispatches builds smoothly so your active apps never lag or freeze.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#FF9900] font-bold">✓</span>
                      <span className="text-[#c9d1d9]">No Server Lag</span>
                    </div>
                    <span className="text-[#8b949e]">Decoupled</span>
                  </div>
                </div>

                {/* CARD 3: AUTO-BUILD & SECRETS */}
                <div className="absolute left-[698px] top-[44px] w-[294px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#bc8cff] hover:shadow-[0_0_20px_rgba(188,140,255,0.2)] rounded-[8px] p-3.5 space-y-2 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 px-1.5 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#bc8cff]/40 flex items-center justify-center transition-colors">
                        <BrandLogos.AWS />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors leading-tight">3. Auto-Build & Secrets</h3>
                        <span className="text-[10px] text-[#8b949e]">Framework & Private Keys</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#bc8cff] border border-[#30363d] font-bold">03</span>
                  </div>
                  <p className="text-[10.5px] text-[#8b949e] leading-relaxed">
                    Auto-detects Node, Python, or Docker and injects your private environment keys.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#3ECF8E]" />
                      <span className="text-[#c9d1d9]">Keys Protected</span>
                    </div>
                    <span className="text-[#bc8cff] font-semibold">Node · Python · Vite</span>
                  </div>
                </div>

                {/* ============================================================= */}
                {/* SECTION 2: PHASE 2 · LIVE RUNTIME & AUTO-SLEEP (BOTTOM ROW)   */}
                {/* ============================================================= */}
                <div className="absolute left-[30px] top-[204px] w-[962px] flex items-center justify-between border-b border-[#30363d]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#f0f6fc]">
                      Phase 2 · Live Runtime & Auto-Sleep Lifecycle
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-semibold">
                    Edge Active
                  </span>
                </div>

                {/* CARD 5: SMART SLEEP & WAKE (Bottom-Left) */}
                <div className="absolute left-[30px] top-[232px] w-[450px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#bc8cff] hover:shadow-[0_0_15px_rgba(188,140,255,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#bc8cff]/40 flex items-center justify-center p-1 text-[#bc8cff] transition-colors">
                        <BrandLogos.Watchdog />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors leading-tight">5. Smart Sleep & Instant Wake</h3>
                        <span className="text-[10px] text-[#8b949e]">Zero Waste Idle Optimization</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#bc8cff] border border-[#30363d] font-bold">05</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">IDLE MEMORY</span>
                      <span className="font-bold text-[#bc8cff]">0 MB RAM</span>
                    </div>
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">WAKE SPEED</span>
                      <span className="font-bold text-[#FF9900]">&lt; 1.0 Second</span>
                    </div>
                    <div className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[8.5px]">AUTO-SLEEP</span>
                      <span className="font-bold text-[#2ea44f]">After 5m Idle</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-1.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#FF9900]" />
                      <span className="text-[#c9d1d9]">Auto-pauses when inactive</span>
                    </div>
                    <span className="text-[#2ea44f]">Always Ready</span>
                  </div>
                </div>

                {/* CARD 4: LIVE CONTAINER & FREE SSL (Bottom-Right) */}
                <div className="absolute left-[542px] top-[232px] w-[450px] bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] hover:border-[#2ea44f] hover:shadow-[0_0_15px_rgba(46,164,79,0.15)] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer group transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-[#0d1117] border border-[#30363d] group-hover:border-[#2ea44f]/40 flex items-center justify-center p-1 text-[#2ea44f] transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#f0f6fc] group-hover:text-[#2ea44f] transition-colors leading-tight">4. Live Container & Free SSL</h3>
                        <span className="text-[10px] text-[#8b949e]">Public Internet Routing</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-bold">04</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono bg-[#0d1117] px-3 py-1.5 rounded border border-[#30363d]">
                    <span className="text-[#2ea44f] font-semibold truncate">https://your-app.deployat.me</span>
                    <span className="text-[9.5px] text-[#2ea44f] bg-[#2ea44f]/10 border border-[#2ea44f]/30 px-2 py-0.5 rounded font-bold">
                      ● Live & Secure
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-1.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#2ea44f] font-bold">✓</span>
                      <span className="text-[#c9d1d9]">512MB RAM Cap · Dedicated CPU Core</span>
                    </div>
                    <span className="text-[#2ea44f] font-bold">Auto-Renewed</span>
                  </div>
                </div>

                {/* Return Wake Loop Badge (Centered Underneath with Generous Margins) */}
                <div className="absolute left-[511px] top-[388px] -translate-x-1/2 z-10 pointer-events-none flex items-center gap-1.5 text-[9.5px] font-mono bg-[#0d1117] text-[#58a6ff] px-3 py-1 rounded-full border border-[#30363d] shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-ping"></span>
                  <span>⚡ Instant &lt;1.0s wake when a visitor opens your URL</span>
                </div>
              </div>
            )}

          </div>
        </div>


        {/* Docked Pipeline Stepper (User Flow Legend) */}
        {activeTab === 'user' && (
          <div className="bg-[#11161d] border-t border-[#30363d] px-5 sm:px-6 py-3.5 select-none animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#2ea44f]" />
                <span className="text-[12px] font-semibold text-[#f0f6fc] font-mono">Automated End-to-End Pipeline</span>
              </div>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#2ea44f] border border-[#30363d] font-semibold">
                0-Config Workflow
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#58a6ff] font-bold">1</span>
                  <span>Write Code</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Commit changes in your local workspace.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#c9d1d9] font-bold">2</span>
                  <span>Push to GitHub</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Push triggers secure automated webhook.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#bc8cff] font-bold">3</span>
                  <span>Build & Sandbox</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Auto-detects framework & injects private keys.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#2ea44f] font-bold">4</span>
                  <span>Live on Edge</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Routes live traffic with free automatic SSL.</p>
              </div>
            </div>
          </div>
        )}

        {/* Docked Architecture Breakdown (AWS Cloud Engine Legend) */}
        {activeTab === 'engine' && (
          <div className="bg-[#11161d] border-t border-[#30363d] px-5 sm:px-6 py-3.5 select-none animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-[#FF9900]" />
                <span className="text-[12px] font-semibold text-[#f0f6fc] font-mono">Platform Cloud Architecture & Lifecycle</span>
              </div>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#FF9900] border border-[#30363d] font-semibold">
                Dual-Zone Topology
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#58a6ff] font-bold">1</span>
                  <span>Secure Ingestion</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Receives code from GitHub immediately when you push.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#FF9900] font-bold">2</span>
                  <span>Smart Queue</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Schedules builds smoothly so active apps never experience lag.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#bc8cff] font-bold">3</span>
                  <span>Auto-Build</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Picks Node/Python automatically and protects private API keys.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#2ea44f] font-bold">4</span>
                  <span>Live Container</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Goes live in an isolated sandbox with free automatic HTTPS.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#f0f6fc]">
                  <span className="w-4 h-4 rounded-full bg-[#21262d] border border-[#30363d] text-[9.5px] font-mono flex items-center justify-center text-[#bc8cff] font-bold">5</span>
                  <span>Smart Sleep</span>
                </div>
                <p className="text-[10.5px] text-[#8b949e] leading-relaxed pl-6">Uses 0MB memory when idle and wakes in under 1 second.</p>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Bottom Status Bar */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2.5 flex items-center justify-between text-[10.5px] font-mono text-[#484f58] select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f]"></span>
              <span className="text-[#c9d1d9] font-medium">
                {activeTab === 'user' ? 'AWS EC2 Container Host + Supabase Control Plane' : 'AWS Cloud Engine · Automated Build & Zero-Waste Sleep/Wake Architecture'}
              </span>
            </span>
            <span className="hidden sm:inline text-[#30363d]">|</span>
            <span className="hidden sm:inline text-[#8b949e]">
              {activeTab === 'user' ? 'Sequential directional pipeline · Zero DevOps configuration' : 'Instant 1-second traffic wake · Zero idle memory waste'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8b949e]">Sandbox: <strong className="text-[#f0f6fc]">512MB Cap</strong></span>
            <span className="text-[#2ea44f] font-semibold">SSL: Active ✓</span>
          </div>
        </div>

      </div>
    </div>
  );
}