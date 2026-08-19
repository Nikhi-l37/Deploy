import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Activity, ShieldCheck, Zap, Globe, ArrowRight, 
  ArrowLeft, Layers, Lock, GitBranch, Server, Cpu,
  Terminal, Network, CheckCircle2
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

  // ── Live Terminal Simulation ──
  const [visibleLines, setVisibleLines] = useState([]);
  const [terminalDone, setTerminalDone] = useState(false);
  const [terminalFading, setTerminalFading] = useState(false);
  const terminalRef = useRef(null);
  const timeoutsRef = useRef([]);

  const runTerminal = useCallback(() => {
    setVisibleLines([]);
    setTerminalDone(false);
    setTerminalFading(false);
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

  // Smooth restart: pause → fade out → clear → replay
  useEffect(() => {
    if (terminalDone) {
      // Wait 4s so user can read the final URL
      const fadeTimer = setTimeout(() => {
        setTerminalFading(true);
      }, 4000);
      
      // After fade animation (600ms), restart
      const restartTimer = setTimeout(() => {
        runTerminal();
      }, 4600);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(restartTimer);
      };
    }
  }, [terminalDone, runTerminal]);

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
                      <span className="text-[#2ea44f]">● deployed</span>
                    )}
                    {!terminalDone && visibleLines.length > 0 && (
                      <span className="text-[#d29922] animate-pulse">● deploying...</span>
                    )}
                  </div>
                </div>

                {/* Terminal Output Body — strict monospace grid */}
                <div 
                  ref={terminalRef}
                  className={`bg-[#0d1117] p-5 sm:p-6 font-mono text-[12px] sm:text-[13px] leading-[1.8] overflow-y-auto max-h-[340px] scroll-smooth transition-opacity duration-500 ${terminalFading ? 'opacity-0' : 'opacity-100'}`}
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
            {/* HOW IT WORKS: DUAL-VIEW ARCHITECTURE CANVAS               */}
            {/* ========================================================== */}
            <div className="max-w-4xl mx-auto pt-8 w-full space-y-5">
              
              {/* Header & Segmented Controller */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                    <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
                      System Architecture
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#f0f6fc] tracking-tight">
                    How Deployat Works
                  </h2>
                </div>

                {/* Segmented Controller Tabs */}
                <div className="inline-flex items-center p-1 rounded-[8px] bg-[#161b22] border border-[#30363d] shadow-sm select-none">
                  <button
                    onClick={() => setArchitectureTab('developer')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                      architectureTab === 'developer'
                        ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm'
                        : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-[#2ea44f]" />
                    <span>Developer Workflow</span>
                  </button>

                  <button
                    onClick={() => setArchitectureTab('engine')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                      architectureTab === 'engine'
                        ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm'
                        : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
                    <span>Internal Engine Architecture</span>
                  </button>
                </div>
              </div>

              {/* Architecture Canvas Viewport */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-6 sm:p-8 shadow-sm relative overflow-hidden text-left">

                {/* ────────────────────────────────────────────────────────── */}
                {/* TAB 1: DEVELOPER WORKFLOW CANVAS (Macro View)              */}
                {/* ────────────────────────────────────────────────────────── */}
                {architectureTab === 'developer' ? (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Top Canvas Bar */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] pb-4 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2ea44f]"></span>
                        <span className="text-[#f0f6fc] font-medium">Macro View</span>
                        <span className="text-[#484f58]">|</span>
                        <span>Local Commit ➔ Webhook Trigger ➔ Global Edge</span>
                      </div>
                      <span className="text-[#484f58] hidden sm:inline">packet.speed: ~3.2s</span>
                    </div>

                    {/* 3-Node Architecture Flow */}
                    <div className="relative pt-2 pb-2">
                      
                      {/* Horizontal connecting track across nodes (desktop only) */}
                      <div className="hidden md:block absolute top-[30px] left-[15%] right-[15%] h-[2px] bg-[#30363d]">
                        {/* Animated traveling green data packet */}
                        <div className="relative w-full h-full">
                          <span className="animate-packet-travel absolute top-[-3.5px] w-2.5 h-2.5 rounded-full bg-[#2ea44f] shadow-[0_0_10px_#2ea44f]"></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative z-10">
                        
                        {/* Node 1: Push Code */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                          <div className="w-12 h-12 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#f0f6fc] shadow-sm">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">01</span>
                              <h3 className="text-sm font-semibold text-[#f0f6fc]">1. Push Code</h3>
                            </div>
                            <p className="text-xs text-[#8b949e] leading-relaxed max-w-[220px]">
                              Developer commits code to repository.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                            git push origin main
                          </span>
                        </div>

                        {/* Mobile Down Arrow indicator */}
                        <div className="flex justify-center md:hidden text-[#484f58]">
                          <span className="text-xs">▼</span>
                        </div>

                        {/* Node 2: Automatic Intake */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                          <div className="w-12 h-12 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#2ea44f] shadow-sm">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">02</span>
                              <h3 className="text-sm font-semibold text-[#f0f6fc]">2. Automatic Intake</h3>
                            </div>
                            <p className="text-xs text-[#8b949e] leading-relaxed max-w-[220px]">
                              Secure webhook instantly captures commit changes.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                            HMAC-SHA256 Webhook
                          </span>
                        </div>

                        {/* Mobile Down Arrow indicator */}
                        <div className="flex justify-center md:hidden text-[#484f58]">
                          <span className="text-xs">▼</span>
                        </div>

                        {/* Node 3: Live on Web */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                          <div className="w-12 h-12 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shadow-sm">
                            <Globe className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">03</span>
                              <h3 className="text-sm font-semibold text-[#f0f6fc]">3. Live on Web</h3>
                            </div>
                            <p className="text-xs text-[#8b949e] leading-relaxed max-w-[220px]">
                              Global live URL active in under 3 seconds.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                            https://*.deployat.me
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  /* ────────────────────────────────────────────────────────── */
                  /* TAB 2: INTERNAL ENGINE ARCHITECTURE CANVAS (Micro View)    */
                  /* ────────────────────────────────────────────────────────── */
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Top Canvas Bar */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] pb-4 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]"></span>
                        <span className="text-[#f0f6fc] font-medium">Micro Engine View</span>
                        <span className="text-[#484f58]">|</span>
                        <span>Multi-Stage Sandboxed Isolation Core</span>
                      </div>
                      <span className="text-[#484f58] hidden sm:inline">isolation: cgroups v2</span>
                    </div>

                    {/* 4-Stage Pipeline Architecture Grid */}
                    <div className="relative pt-2 pb-2">
                      
                      {/* Horizontal connecting track across stages (desktop only) */}
                      <div className="hidden lg:block absolute top-[30px] left-[10%] right-[10%] h-[2px] bg-[#30363d]">
                        {/* High-frequency animated traveling cyan pulse packet */}
                        <div className="relative w-full h-full">
                          <span className="animate-packet-travel-fast absolute top-[-3.5px] w-2.5 h-2.5 rounded-full bg-[#58a6ff] shadow-[0_0_10px_#58a6ff]"></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        
                        {/* Stage 1: Code Pull */}
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 bg-[#0d1117] p-4 rounded-[6px] border border-[#30363d]/60">
                          <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shadow-sm">
                            <GitBranch className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">01</span>
                              <h3 className="text-xs font-semibold text-[#f0f6fc]">Code Pull</h3>
                            </div>
                            <p className="text-[11px] text-[#8b949e] leading-relaxed">
                              Pulls fresh production branch layout into an isolated environment.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d] mt-auto">
                            git.clone --depth=1
                          </span>
                        </div>

                        {/* Stage 2: Secrets Injection */}
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 bg-[#0d1117] p-4 rounded-[6px] border border-[#30363d]/60">
                          <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#bc8cff] shadow-sm">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">02</span>
                              <h3 className="text-xs font-semibold text-[#f0f6fc]">Secrets Injection</h3>
                            </div>
                            <p className="text-[11px] text-[#8b949e] leading-relaxed">
                              Safely maps and encrypts hidden <code className="text-[#bc8cff]">.env</code> keys into the build stack.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d] mt-auto">
                            fernet.aes_128_gcm
                          </span>
                        </div>

                        {/* Stage 3: Docker Containment */}
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 bg-[#0d1117] p-4 rounded-[6px] border border-[#30363d]/60">
                          <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#d29922] shadow-sm">
                            <Server className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">03</span>
                              <h3 className="text-xs font-semibold text-[#f0f6fc]">Docker Containment</h3>
                            </div>
                            <p className="text-[11px] text-[#8b949e] leading-relaxed">
                              Packages app layers inside a localized, secure server container instance.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d] mt-auto">
                            docker.build --cgroup
                          </span>
                        </div>

                        {/* Stage 4: Proxy Routing */}
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 bg-[#0d1117] p-4 rounded-[6px] border border-[#30363d]/60">
                          <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#2ea44f] shadow-sm">
                            <Network className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                              <span className="text-[10px] font-mono text-[#484f58]">04</span>
                              <h3 className="text-xs font-semibold text-[#f0f6fc]">Proxy Routing</h3>
                            </div>
                            <p className="text-[11px] text-[#8b949e] leading-relaxed">
                              Configures Nginx reverse proxy routes to securely handle external client traffic.
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d] mt-auto">
                            nginx.reverse_proxy
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

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
