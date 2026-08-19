import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Activity, ShieldCheck, Zap, Globe, ArrowRight, 
  ArrowLeft, Layers, Lock, GitBranch, Server, Cpu,
  Network, Plus, Minus, Maximize2, RefreshCw, Box, 
  Database, HardDrive, Folder, Grid
} from 'lucide-react';

// Terminal deployment simulation lines
const PIPELINE_LINES = [
  { text: '$ git push origin main', delay: 600, type: 'command' },
  { text: 'Writing objects: 100% (42/42), 1.2 MiB | done.', delay: 350, type: 'dim' },
  { text: '', delay: 200, type: 'blank' },
  { ts: '00:01', text: 'Webhook received', color: '#58a6ff', delay: 400, type: 'info', badge: 'HMAC-SHA256 ✓' },
  { ts: '00:01', text: 'Build queued', color: '#8b949e', delay: 300, type: 'muted', badge: 'redis' },
  { ts: '00:02', text: 'Cloning repository', color: '#8b949e', delay: 500, type: 'muted' },
  { ts: '00:03', text: 'Runtime detected', color: '#58a6ff', delay: 400, type: 'info', badge: 'Node.js 20 LTS' },
  { ts: '00:03', text: 'Dockerfile generated', color: '#8b949e', delay: 350, type: 'muted', badge: 'multi-stage' },
  { ts: '00:04', text: 'Building image', color: '#d29922', delay: 900, type: 'warn', badge: 'docker build' },
  { ts: '00:12', text: 'Secrets injected', color: '#bc8cff', delay: 350, type: 'purple', badge: 'Fernet AES-128' },
  { ts: '00:13', text: 'Container started', color: '#58a6ff', delay: 350, type: 'info', badge: ':49203' },
  { ts: '00:13', text: 'Nginx configured', color: '#2ea44f', delay: 300, type: 'muted', badge: 'reload ✓' },
  { text: '', delay: 250, type: 'blank' },
  { ts: '00:14', text: '✓ Live at https://myapp.deployat.me', color: '#2ea44f', delay: 0, type: 'success' },
];

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [architectureTab, setArchitectureTab] = useState('developer'); // 'developer' | 'engine'

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('Error logging in:', error.message);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setIsLoading(false);
    }
  };

  // ── Live Terminal Simulation (Runs once and stays visible) ──
  const [visibleLines, setVisibleLines] = useState([]);
  const [terminalDone, setTerminalDone] = useState(false);
  const terminalRef = useRef(null);
  const timeoutsRef = useRef([]);

  const runTerminal = useCallback(() => {
    setVisibleLines([]);
    setTerminalDone(false);
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];

    let cumulative = 500;
    PIPELINE_LINES.forEach((line, i) => {
      cumulative += line.delay;
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
        if (i === PIPELINE_LINES.length - 1) {
          setTerminalDone(true);
        }
      }, cumulative);
      timeoutsRef.current.push(t);
    });
  }, []);

  useEffect(() => {
    if (!showLogin) {
      runTerminal();
    }
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, [showLogin, runTerminal]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0d1117] text-[#c9d1d9] antialiased">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-[#161b22] border-b border-[#30363d] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Badge */}
          <div 
            onClick={() => setShowLogin(false)}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#238636] flex items-center justify-center text-white shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#f0f6fc] tracking-tight">Deployat</span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                PaaS
              </span>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {showLogin ? (
              <button 
                onClick={() => setShowLogin(false)}
                className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#f0f6fc] font-medium py-1.5 px-3 rounded-[6px] border border-[#30363d] hover:bg-[#21262d] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
              </button>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 text-xs sm:text-sm text-[#f0f6fc] font-medium py-1.5 px-3.5 rounded-[6px] border border-[#30363d] hover:bg-[#21262d] hover:border-[#8b949e] transition-colors cursor-pointer"
              >
                {/* Official GitHub Octocat SVG */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT VIEW */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-6xl mx-auto w-full">
        
        {/* ============================================================ */}
        {/* A. AUTH CARD STATE (When showLogin === true) */}
        {/* ============================================================ */}
        {showLogin ? (
          <div className="w-full max-w-md animate-fade-in space-y-4">
            
            {/* Escape Hatch Button */}
            <button 
              onClick={() => setShowLogin(false)}
              className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to homepage
            </button>

            {/* Native GitHub Dark Card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] shadow-sm overflow-hidden">
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                
                {/* Logo Badge */}
                <div className="w-12 h-12 bg-[#21262d] border border-[#30363d] rounded-[6px] flex items-center justify-center text-[#2ea44f] mb-5">
                  <Activity className="w-6 h-6" />
                </div>
                
                {/* Platform Badge */}
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-[11px] text-[#8b949e] mb-3 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f]"></span>
                  <span className="text-[#f0f6fc] font-medium">Deployat</span>
                  <span>•</span>
                  <span>PaaS</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-semibold text-[#f0f6fc] tracking-tight mb-2">
                  Sign in to Deployat
                </h1>
                
                {/* Description */}
                <p className="text-xs sm:text-sm text-[#8b949e] max-w-sm mb-6 leading-relaxed">
                  Authenticate securely via GitHub to access your services and deployment dashboard.
                </p>

                {/* GitHub Action Button */}
                <button 
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#238636] hover:bg-[#2ea043] active:bg-[#29903b] text-[#ffffff] font-medium py-2.5 px-4 rounded-[6px] border border-[rgba(240,246,252,0.1)] shadow-[0_1px_0_rgba(27,31,36,0.1)] transition-colors text-sm disabled:opacity-50 select-none cursor-pointer"
                >
                  {/* Official GitHub Octocat SVG */}
                  <svg className="w-4 h-4 fill-[#ffffff]" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>{isLoading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ffffff] opacity-80" />
                </button>

                {/* Clean Flat Features Row */}
                <div className="mt-8 pt-6 border-t border-[#30363d] w-full grid grid-cols-3 divide-x divide-[#30363d] text-center">
                  <div className="px-2 flex flex-col items-center">
                    <Zap className="w-4 h-4 text-[#d29922] mb-1" />
                    <span className="text-xs font-medium text-[#f0f6fc] leading-snug">Instant Builds</span>
                    <span className="text-[11px] text-[#8b949e]">Auto Docker</span>
                  </div>
                  
                  <div className="px-2 flex flex-col items-center">
                    <ShieldCheck className="w-4 h-4 text-[#2ea44f] mb-1" />
                    <span className="text-xs font-medium text-[#f0f6fc] leading-snug">Encrypted</span>
                    <span className="text-[11px] text-[#8b949e]">Fernet AES</span>
                  </div>

                  <div className="px-2 flex flex-col items-center">
                    <Globe className="w-4 h-4 text-[#58a6ff] mb-1" />
                    <span className="text-xs font-medium text-[#f0f6fc] leading-snug">Live Proxy</span>
                    <span className="text-[11px] text-[#8b949e]">Auto Nginx</span>
                  </div>
                </div>
                
              </div>

              {/* Flat Status Footer */}
              <div className="px-6 py-3 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2ea44f]"></span>
                  <span className="text-[#8b949e]">All systems operational</span>
                </div>
                <span className="font-mono text-[11px] text-[#8b949e]">OAuth 2.0</span>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* B. MODERN DEVELOPER LANDING PAGE (When showLogin === false)  */
          /* ============================================================ */
          <div className="w-full space-y-16 py-4 animate-fade-in text-center">
            
            {/* Hero Section */}
            <div className="space-y-5 max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                <span className="text-[#f0f6fc] font-medium">Deployat v1.0</span>
                <span>•</span>
                <span>Self-Hosted Developer PaaS</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f0f6fc] leading-tight">
                The fastest path from <br className="hidden sm:inline" />
                <span className="text-[#2ea44f]">code</span> to <span className="text-[#f0f6fc]">production</span>.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[#8b949e] max-w-xl mx-auto leading-relaxed">
                Connect your repository, configure environment secrets, and Deployat automatically builds Docker containers and generates Nginx reverse proxy routes in seconds.
              </p>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                  className="flex items-center gap-2.5 bg-[#238636] hover:bg-[#2ea043] active:bg-[#29903b] text-[#ffffff] font-semibold py-2.5 px-6 rounded-[6px] border border-[rgba(240,246,252,0.1)] shadow-[0_1px_0_rgba(27,31,36,0.1)] transition-colors text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-[#ffffff]" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 text-[#ffffff] opacity-80" />
                </button>

                <button 
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium py-2.5 px-5 rounded-[6px] border border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors cursor-pointer"
                >
                  <span>Sign In</span>
                </button>
              </div>
            </div>

            {/* ========================================================== */}
            {/* LIVE DEPLOYMENT TERMINAL SIMULATION                        */}
            {/* ========================================================== */}
            <div className="max-w-3xl mx-auto pt-6 w-full">
              {/* Terminal Header Label */}
              <div className="text-left mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
                  Live Deploy Preview
                </span>
                <span className="text-[10px] font-mono text-[#484f58]">— watch a deployment happen</span>
              </div>

              {/* Terminal Window */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] shadow-sm overflow-hidden">

                {/* macOS Terminal Title Bar */}
                <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#f85149]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#d29922]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#2ea44f]"></span>
                    <span className="ml-2 text-[11px] font-mono text-[#484f58]">deployat — bash</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#484f58]">
                    {terminalDone && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#2ea44f]">● deployed</span>
                        <button 
                          onClick={runTerminal}
                          className="text-[#8b949e] hover:text-[#f0f6fc] text-[10px] underline underline-offset-2 cursor-pointer transition-colors"
                        >
                          Replay
                        </button>
                      </div>
                    )}
                    {!terminalDone && visibleLines.length > 0 && (
                      <span className="text-[#d29922] animate-pulse">● deploying...</span>
                    )}
                  </div>
                </div>

                {/* Terminal Output Body — strict monospace grid */}
                <div 
                  ref={terminalRef}
                  className="bg-[#0d1117] p-5 sm:p-6 font-mono text-[12px] sm:text-[13px] leading-[1.8] overflow-y-auto max-h-[340px] scroll-smooth"
                >
                  {visibleLines.map((line, i) => (
                    <div 
                      key={i} 
                      className="animate-fade-in"
                      style={{ animationDelay: '0ms' }}
                    >
                      {line.type === 'blank' ? (
                        <div className="h-3"></div>
                      ) : line.type === 'command' ? (
                        /* Authentic terminal command prompt */
                        <div className="flex items-center gap-0">
                          <span className="text-[#3fb950] select-none">$ </span>
                          <span className="text-[#f0f6fc]">{line.text.replace('$ ', '')}</span>
                        </div>
                      ) : line.type === 'success' ? (
                        /* Final success line with clickable URL */
                        <div className="flex items-center gap-2 mt-0.5">
                          {line.ts && (
                            <span className="text-[#484f58] text-[10px] w-[34px] shrink-0 select-none">{line.ts}</span>
                          )}
                          <span className="text-[#3fb950]">✓</span>
                          <span className="text-[#3fb950]">Live at</span>
                          <a 
                            href="#" 
                            onClick={(e) => e.preventDefault()} 
                            className="text-[#58a6ff] underline underline-offset-2 decoration-[#58a6ff]/40 hover:decoration-[#58a6ff]"
                          >
                            https://myapp.deployat.me
                          </a>
                        </div>
                      ) : (
                        /* Standard log line with timestamp + badge */
                        <div className="flex items-center gap-2">
                          {line.ts && (
                            <span className="text-[#484f58] text-[10px] w-[34px] shrink-0 select-none">{line.ts}</span>
                          )}
                          <span style={{ color: line.color }}>{line.text}</span>
                          {line.badge && (
                            <span className="text-[10px] px-1.5 py-[1px] rounded bg-[#21262d] border border-[#30363d] text-[#8b949e]">
                              {line.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Blinking cursor */}
                  {!terminalDone && (
                    <span className="inline-block w-[7px] h-[14px] bg-[#c9d1d9] animate-pulse rounded-[1px] align-middle ml-0.5 mt-0.5"></span>
                  )}
                </div>

                {/* Terminal Status Bar */}
                <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#484f58]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${terminalDone ? 'bg-[#3fb950]' : 'bg-[#d29922] animate-pulse'}`}></span>
                    <span className="text-[#8b949e]">
                      {terminalDone ? 'deploy complete · 14s' : `running · step ${visibleLines.length}/${PIPELINE_LINES.length}`}
                    </span>
                  </div>
                  <span>bash · utf-8</span>
                </div>

              </div>
            </div>

            {/* ========================================================== */}
            {/* RAILWAY-STYLE 2D INFRASTRUCTURE TOPOLOGY CANVAS           */}
            {/* ========================================================== */}
            <div className="max-w-5xl mx-auto pt-8 w-full space-y-4">
              
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                    <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
                      Live Infrastructure Canvas
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#f0f6fc] tracking-tight">
                    Multi-Service Topology & Routing
                  </h2>
                </div>

                {/* Topology Preset Switcher */}
                <div className="inline-flex items-center p-1 rounded-[8px] bg-[#161b22] border border-[#30363d] select-none">
                  <button
                    onClick={() => setArchitectureTab('developer')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                      architectureTab === 'developer'
                        ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm'
                        : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 text-[#58a6ff]" />
                    <span>Microservices Mesh</span>
                  </button>

                  <button
                    onClick={() => setArchitectureTab('engine')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                      architectureTab === 'engine'
                        ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm'
                        : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-[#bc8cff]" />
                    <span>Grouped Service Cluster</span>
                  </button>
                </div>
              </div>

              {/* Railway Dot-Grid Canvas Window */}
              <div className="bg-[#0b0e14] border border-[#30363d] rounded-[8px] overflow-hidden shadow-2xl relative">

                {/* Canvas Toolbar Header */}
                <div className="bg-[#161b22]/90 backdrop-blur border-b border-[#30363d] px-4 py-2 flex items-center justify-between z-30 relative select-none">
                  {/* Left: Canvas Zoom/Pan Toolbox */}
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

                  {/* Center: Environment status */}
                  <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#8b949e]">
                    <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                    <span>production-mesh</span>
                    <span className="text-[#484f58]">·</span>
                    <span className="text-[#484f58]">us-east-1 (cgroups v2)</span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#8b949e] px-2 py-1 rounded bg-[#0d1117] border border-[#30363d]">
                      <RefreshCw className="w-3 h-3 text-[#2ea44f] animate-spin" style={{ animationDuration: '4s' }} />
                      <span>Sync</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#f0f6fc] px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] transition-colors cursor-pointer">
                      <Plus className="w-3 h-3" />
                      <span>Create</span>
                    </div>
                  </div>
                </div>

                {/* ─── 2D TOPOLOGY GRAPH (DOT GRID CANVAS) ─── */}
                <div className="relative w-full h-[520px] bg-[#0b0e14] bg-dot-grid overflow-hidden">

                  {/* PRESET 1: FULL-STACK MICROSERVICES GRAPH */}
                  {architectureTab === 'developer' ? (
                    <div className="w-full h-full relative animate-fade-in">
                      
                      {/* SVG CONNECTOR WIRES WITH TRAVELING LIGHT SPIKES */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Wire 1: Ackee Analytics ➔ Frontend */}
                        <path 
                          id="wire-analytics-fe"
                          d="M 230 225 C 290 225, 300 100, 370 100" 
                          fill="none" 
                          stroke="#21262d" 
                          strokeWidth="2" 
                        />
                        <path 
                          d="M 230 225 C 290 225, 300 100, 370 100" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="3.5" fill="#58a6ff" filter="url(#glow-cyan)">
                          <animateMotion dur="3.2s" repeatCount="indefinite" path="M 230 225 C 290 225, 300 100, 370 100" />
                        </circle>

                        {/* Wire 2: Frontend ➔ Backend */}
                        <path 
                          id="wire-fe-be"
                          d="M 520 100 C 580 100, 590 145, 650 145" 
                          fill="none" 
                          stroke="#21262d" 
                          strokeWidth="2" 
                        />
                        <path 
                          d="M 520 100 C 580 100, 590 145, 650 145" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="4" fill="#2ea44f" filter="url(#glow-green)">
                          <animateMotion dur="2.4s" repeatCount="indefinite" path="M 520 100 C 580 100, 590 145, 650 145" />
                        </circle>

                        {/* Wire 3: API Gateway ➔ Backend */}
                        <path 
                          id="wire-gw-be"
                          d="M 520 380 C 580 380, 590 175, 650 175" 
                          fill="none" 
                          stroke="#21262d" 
                          strokeWidth="2" 
                        />
                        <path 
                          d="M 520 380 C 580 380, 590 175, 650 175" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="3.5" fill="#58a6ff" filter="url(#glow-cyan)">
                          <animateMotion dur="2.8s" repeatCount="indefinite" path="M 520 380 C 580 380, 590 175, 650 175" />
                        </circle>

                        {/* Wire 4: Backend ➔ Postgres */}
                        <path 
                          id="wire-be-pg"
                          d="M 720 200 L 720 320" 
                          fill="none" 
                          stroke="#21262d" 
                          strokeWidth="2" 
                        />
                        <path 
                          d="M 720 200 L 720 320" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="3.5" fill="#bc8cff" filter="url(#glow-purple)">
                          <animateMotion dur="2.0s" repeatCount="indefinite" path="M 720 200 L 720 320" />
                        </circle>

                        {/* Wire 5: Frontend ➔ API Gateway internal sync */}
                        <path 
                          d="M 445 150 L 445 330" 
                          fill="none" 
                          stroke="#21262d" 
                          strokeWidth="1.5" 
                          strokeDasharray="3 3" 
                        />
                      </svg>

                      {/* ─── SERVICE NODE CARDS (ABSOLUTE 2D COORDINATES) ─── */}

                      {/* Node 1: Ackee Analytics (Left) */}
                      <div 
                        className="absolute left-6 sm:left-10 top-[175px] w-[180px] sm:w-[195px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#58a6ff] rounded-[8px] p-3.5 space-y-2.5 transition-all duration-150 z-10 shadow-lg cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1b7c84] flex items-center justify-center text-white text-[10px] font-bold">
                            ●
                          </span>
                          <span className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
                            ackee analytics
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#58a6ff] truncate">
                          ackee-prod.up.deployat.me
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <span className="text-[#2ea44f]">✓</span>
                          <span>Docker Image</span>
                        </div>
                      </div>

                      {/* Node 2: JS Frontend (Center Top) */}
                      <div 
                        className="absolute left-[36%] sm:left-[38%] top-[50px] w-[180px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#f1e05a] rounded-[8px] p-3.5 space-y-2.5 transition-all duration-150 z-10 shadow-lg cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-[4px] bg-[#f1e05a] text-[#000000] text-[9px] font-black flex items-center justify-center">
                            JS
                          </span>
                          <span className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#f1e05a] transition-colors">
                            frontend
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#58a6ff] truncate">
                          frontend-prod.up.deployat.me
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#2ea44f]">✓</span>
                            <span>Deployed now</span>
                          </div>
                          <span className="text-[#484f58]">:3000</span>
                        </div>
                      </div>

                      {/* Node 3: GO API Gateway (Center Bottom) */}
                      <div 
                        className="absolute left-[36%] sm:left-[38%] top-[330px] w-[180px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#00add8] rounded-[8px] p-3.5 space-y-2.5 transition-all duration-150 z-10 shadow-lg cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-[4px] bg-[#00add8] text-white text-[9px] font-black flex items-center justify-center">
                            GO
                          </span>
                          <span className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#00add8] transition-colors">
                            api gateway
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#58a6ff] truncate">
                          api-prod.up.deployat.me
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#2ea44f]">✓</span>
                            <span>Deployed now</span>
                          </div>
                          <span className="text-[#484f58]">HTTP/WS</span>
                        </div>
                      </div>

                      {/* Node 4: Python Backend (Right Top) */}
                      <div 
                        className="absolute right-6 sm:right-12 top-[95px] w-[180px] sm:w-[210px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#3572A5] rounded-[8px] p-3.5 space-y-2.5 transition-all duration-150 z-10 shadow-lg cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-[4px] bg-[#3572A5] text-white text-[9px] font-black flex items-center justify-center">
                              PY
                            </span>
                            <span className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
                              backend
                            </span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                            3 Replicas
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#8b949e] truncate">
                          fastapi · uvicorn workers
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#2ea44f]">✓</span>
                            <span>Deployed now</span>
                          </div>
                          <span className="text-[#484f58]">:8000</span>
                        </div>
                      </div>

                      {/* Node 5: Postgres Database (Right Bottom) */}
                      <div 
                        className="absolute right-6 sm:right-12 top-[320px] w-[180px] sm:w-[210px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] hover:border-[#336791] rounded-[8px] p-3.5 space-y-2.5 transition-all duration-150 z-10 shadow-lg cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-[4px] bg-[#336791] text-white flex items-center justify-center">
                            <Database className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
                            postgres
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#8b949e] truncate">
                          PostgreSQL 16 · Supabase
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#2ea44f]">✓</span>
                            <span>Docker Image</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#484f58]">
                            <HardDrive className="w-3 h-3" />
                            <span>pg-data</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* PRESET 2: GROUPED SERVICE CLUSTER (METABASE + DB + REDIS) */
                    <div className="w-full h-full relative animate-fade-in">
                      
                      {/* SVG CONNECTOR WIRES */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                          <filter id="glow-green-2" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Wire: Frontend ➔ Backend */}
                        <path 
                          d="M 280 120 L 370 120" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="4" fill="#2ea44f" filter="url(#glow-green-2)">
                          <animateMotion dur="2.2s" repeatCount="indefinite" path="M 280 120 L 370 120" />
                        </circle>

                        {/* Wire: Backend ➔ Redis */}
                        <path 
                          d="M 520 120 C 560 120, 560 210, 600 210" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="3.5" fill="#f85149" filter="url(#glow-amber)">
                          <animateMotion dur="2.8s" repeatCount="indefinite" path="M 520 120 C 560 120, 560 210, 600 210" />
                        </circle>

                        {/* Wire: Backend ➔ Metabase Cluster */}
                        <path 
                          d="M 445 175 L 445 280" 
                          fill="none" 
                          stroke="#30363d" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <circle r="3.5" fill="#58a6ff">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M 445 175 L 445 280" />
                        </circle>
                      </svg>

                      {/* Node: Frontend (Top-Left) */}
                      <div 
                        className="absolute left-6 sm:left-14 top-[70px] w-[180px] sm:w-[200px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#000000] border border-[#30363d] text-white text-[9px] font-bold flex items-center justify-center">
                            ▲
                          </span>
                          <span className="text-xs font-semibold text-[#f0f6fc]">frontend</span>
                        </div>
                        <p className="text-[10px] font-mono text-[#58a6ff] truncate">
                          frontend-prod.up.deployat.me
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <span className="text-[#2ea44f]">✓</span>
                          <span>Deployed just now</span>
                        </div>
                      </div>

                      {/* Node: Rust Backend (Top-Center) */}
                      <div 
                        className="absolute left-[34%] sm:left-[37%] top-[70px] w-[180px] sm:w-[210px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-[4px] bg-[#dea584] text-[#000000] text-[9px] font-black flex items-center justify-center">
                              R
                            </span>
                            <span className="text-xs font-semibold text-[#f0f6fc]">backend</span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                            3 Replicas
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#8b949e] truncate">
                          Rust Actix-web server
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <span className="text-[#2ea44f]">✓</span>
                          <span>Deployed just now</span>
                        </div>
                      </div>

                      {/* Node: Redis (Top-Right) */}
                      <div 
                        className="absolute right-6 sm:right-14 top-[160px] w-[170px] sm:w-[190px] bg-[#161b22]/95 backdrop-blur border border-[#30363d] rounded-[8px] p-3.5 space-y-2.5 z-10 shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-[4px] bg-[#d82c20] text-white text-[9px] font-black flex items-center justify-center">
                            RD
                          </span>
                          <span className="text-xs font-semibold text-[#f0f6fc]">redis</span>
                        </div>
                        <p className="text-[10px] font-mono text-[#8b949e] truncate">
                          Redis 7.2 in-memory
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#2ea44f]">✓</span>
                            <span>Docker Image</span>
                          </div>
                          <span className="text-[#484f58]">/bitnami</span>
                        </div>
                      </div>

                      {/* GROUP CONTAINER: METABASE CLUSTER (BOTTOM) */}
                      <div className="absolute left-6 sm:left-14 bottom-6 right-6 sm:right-[320px] bg-[#161b22]/60 border border-[#1f6feb]/40 rounded-[10px] p-3 space-y-3 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#58a6ff]">
                          <div className="flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5" />
                            <span className="font-semibold">Metabase Group</span>
                          </div>
                          <span className="text-[10px] text-[#8b949e]">2 services</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Inner Node: Metabase */}
                          <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-3 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded bg-[#509ee3] text-white text-[8px] font-bold flex items-center justify-center">
                                M
                              </span>
                              <span className="text-xs font-semibold text-[#f0f6fc]">Metabase</span>
                            </div>
                            <p className="text-[9px] font-mono text-[#58a6ff] truncate">
                              mtbase-prod.up.deployat.me
                            </p>
                            <div className="flex items-center gap-1 text-[9px] text-[#8b949e] font-mono">
                              <span className="text-[#2ea44f]">✓</span>
                              <span>Docker Image</span>
                            </div>
                          </div>

                          {/* Inner Node: Postgres */}
                          <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-3 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-[#336791]" />
                              <span className="text-xs font-semibold text-[#f0f6fc]">postgres</span>
                            </div>
                            <p className="text-[9px] font-mono text-[#8b949e] truncate">
                              Internal Network Route
                            </p>
                            <div className="flex items-center justify-between text-[9px] text-[#8b949e] font-mono">
                              <div className="flex items-center gap-1">
                                <span className="text-[#2ea44f]">✓</span>
                                <span>Docker Image</span>
                              </div>
                              <span className="text-[#484f58]">pg-data</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Canvas Bottom Status Bar */}
                <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#484f58] select-none">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f]"></span>
                      <span className="text-[#8b949e]">all 5 nodes healthy</span>
                    </span>
                    <span className="hidden sm:inline">|</span>
                    <span className="hidden sm:inline text-[#8b949e]">live traffic packets traveling via reverse proxy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>latency: 18ms</span>
                    <span>ssl: active ✓</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-[#161b22] border border-[#30363d] hover:border-[#444c56] rounded-[6px] p-4 space-y-1.5 transition-colors duration-150 cursor-default">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Zap className="w-3.5 h-3.5 text-[#d29922]" />
                  <span>Zero-Config Builds</span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  Automatic language detection for Node.js, Python, Vite, Next.js, and custom Dockerfiles.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] hover:border-[#444c56] rounded-[6px] p-4 space-y-1.5 transition-colors duration-150 cursor-default">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Lock className="w-3.5 h-3.5 text-[#2ea44f]" />
                  <span>Fernet Encryption</span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  API keys and environment variables are symmetrically encrypted at rest in Supabase.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] hover:border-[#444c56] rounded-[6px] p-4 space-y-1.5 transition-colors duration-150 cursor-default">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Layers className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Strict Resource Limits</span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  Protected with 128MB RAM caps and 25% CPU throttling to prevent runaway processes.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full bg-[#161b22] border-t border-[#30363d] px-4 sm:px-8 py-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ea44f]"></span>
            <span>All systems operational</span>
          </div>
          <p className="text-[11px] text-[#8b949e]">
            Deployat • Mini-PaaS • FastAPI, Docker & Supabase
          </p>
        </div>
      </footer>

    </div>
  );
}
