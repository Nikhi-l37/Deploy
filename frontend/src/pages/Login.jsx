import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Activity, ShieldCheck, Zap, Globe, ArrowRight, 
  ArrowLeft, Layers, Lock 
} from 'lucide-react';
import ArchitectureCanvas from '../components/ArchitectureCanvas';

// Terminal deployment simulation lines with clean developer technical descriptions
const PIPELINE_LINES = [
  { text: '$ git push origin main', delay: 350, type: 'command' },
  { text: 'remote: Resolving deltas: 100% (26/26), 1.45 MiB | 12.8 MiB/s, done.', delay: 200, type: 'dim' },
  { ts: '00:01', prefix: '✓', action: 'GitHub Webhook received and verified', target: 'HMAC-SHA256', delay: 300, badge: 'verified' },
  { ts: '00:02', prefix: '✓', action: 'Build job dispatched to background worker', target: 'Redis Stream', delay: 250, badge: 'queued' },
  { ts: '00:03', prefix: '✓', action: 'Cloning repository into build workspace', target: 'depth=1', delay: 350, badge: 'git clone' },
  { ts: '00:04', prefix: '✓', action: 'Runtime auto-detected', target: 'Node.js 20 LTS (Fastify + React SSR)', delay: 300, badge: 'Node.js 20' },
  { ts: '00:05', prefix: '✓', action: 'Multi-stage Dockerfile generated', target: 'Alpine 3.19 base', delay: 300, badge: 'multi-stage' },
  { ts: '00:07', prefix: '✓', action: 'Compiling container image & caching build layers', target: 'docker build', delay: 600, badge: 'cached' },
  { ts: '00:10', prefix: '✓', action: 'Allocating sandbox', target: '128MB RAM cap & 25% CPU throttle', delay: 300, badge: 'cgroups v2' },
  { ts: '00:12', prefix: '✓', action: 'Decrypting .env secrets into container environment', target: 'Fernet AES-128 GCM', delay: 300, badge: 'AES-128' },
  { ts: '00:13', prefix: '✓', action: 'Container running in sandbox and bound to port', target: ':49203', delay: 300, badge: 'healthy' },
  { ts: '00:14', prefix: '✓', action: 'Nginx edge reverse proxy reloaded & SSL certificate provisioned', target: 'HTTP/2 SSL', delay: 250, badge: 'active' },
  { ts: '00:15', prefix: '🚀', action: 'Deployment complete! Application is live at', target: 'https://myapp.deployat.me', delay: 0, type: 'success', badge: '15.2s' },
];

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

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

    let cumulative = 300;
    PIPELINE_LINES.forEach((line, i) => {
      cumulative += line.delay;
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
        if (i === PIPELINE_LINES.length - 1) {
          setTerminalDone(true);
        }
      }, cumulative);
      timeoutsRef.current.push(t);
    });
  }, []);

  useEffect(() => {
    runTerminal();
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, [runTerminal]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#010409] text-[#c9d1d9] antialiased">
      
      {/* 1. TOP NAVIGATION BAR (Elevated Layer) */}
      <header className="sticky top-0 z-40 w-full bg-[#161b22] border-b border-[#30363d] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Badge */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-[6px] bg-[#238636] flex items-center justify-center text-white shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#f0f6fc] tracking-tight">Deployat</span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                PaaS
              </span>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs sm:text-sm text-[#f0f6fc] font-medium py-1.5 px-3.5 rounded-[6px] border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] hover:border-[#8b949e] transition-colors cursor-pointer disabled:opacity-50"
            >
              {/* Official GitHub Octocat SVG */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{isLoading ? 'Connecting...' : 'Sign In'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT VIEW (Base Deep Black Canvas) */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-4 sm:py-6 max-w-6xl mx-auto w-full">
        <div className="w-full space-y-10 sm:space-y-14 animate-fade-in text-center">
            
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center text-center pt-8 sm:pt-14 pb-2 space-y-6 sm:space-y-8 max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] text-xs sm:text-sm text-[#8b949e] font-mono shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ea44f] animate-pulse"></span>
                <span className="text-[#f0f6fc] font-semibold">Deployat v1.0</span>
                <span className="text-[#484f58]">•</span>
                <span className="text-[#c9d1d9]">Self-Hosted Developer PaaS</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] text-[#ffffff] leading-[1.15] sm:leading-[1.12]">
                The fastest path from <br className="hidden sm:inline" />
                <span className="text-[#3fb950]">code</span> to production.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-xl lg:text-2xl text-[#8b949e] max-w-3xl mx-auto leading-relaxed font-normal">
                Connect your repository, configure environment secrets, and Deployat automatically builds Docker containers and generates Nginx reverse proxy routes in seconds.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                  className="flex items-center gap-3 bg-[#238636] hover:bg-[#2ea043] active:bg-[#29903b] text-[#ffffff] font-semibold py-3.5 px-8 rounded-[8px] border border-[rgba(240,246,252,0.1)] shadow-[0_2px_8px_rgba(35,134,54,0.3)] transition-all transform hover:-translate-y-0.5 text-base cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-[#ffffff]" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 text-[#ffffff] opacity-80" />
                </button>

                <button 
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-base font-medium py-3.5 px-7 rounded-[8px] border border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:text-[#f0f6fc] hover:bg-[#21262d] hover:border-[#8b949e] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>Sign In</span>
                </button>
              </div>

              {/* Scroll Cue indicator */}
              <div className="pt-2 flex flex-col items-center gap-1 text-xs font-mono text-[#8b949e] opacity-70 animate-bounce">
                <span>Explore Live Deployment & Architecture</span>
                <span className="text-sm">↓</span>
              </div>
            </section>

            {/* ========================================================== */}
            {/* LIVE DEPLOYMENT TERMINAL SIMULATION (Elevated Container)    */}
            {/* ========================================================== */}
            <div className="max-w-5xl mx-auto w-full">
              {/* Terminal Header Label */}
              <div className="text-left mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ea44f] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
                  Live Deploy Preview
                </span>
                <span className="text-[11px] font-mono text-[#484f58]">— watch a real deployment happen in real-time</span>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-[10px] shadow-2xl overflow-hidden text-left">
                <div className="bg-[#161b22]/95 backdrop-blur border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#f85149]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#d29922]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#2ea44f]"></span>
                    <span className="ml-2 text-xs font-mono text-[#8b949e]">deployat — live-build-pipeline</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#8b949e]">
                    {terminalDone && (
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#3fb950] font-medium">● deployed in 15.2s</span>
                        <button 
                          onClick={runTerminal}
                          className="text-[#8b949e] hover:text-[#f0f6fc] text-[11px] px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] cursor-pointer transition-colors"
                        >
                          Replay
                        </button>
                      </div>
                    )}
                    {!terminalDone && visibleLines.length > 0 && (
                      <span className="text-[#d29922] animate-pulse font-medium">● executing pipeline...</span>
                    )}
                  </div>
                </div>

                {/* Recessed Screen Area - Clean GitHub Actions Terminal Theme */}
                <div 
                  ref={terminalRef}
                  className="bg-[#080b10] p-5 sm:p-6 font-mono text-[12.5px] sm:text-[13px] leading-[1.75] space-y-1.5"
                >
                  {visibleLines.map((line, i) => (
                    <div 
                      key={i} 
                      className="animate-fade-in"
                      style={{ animationDelay: '0ms' }}
                    >
                      {line.type === 'command' ? (
                        <div className="flex items-center gap-2 font-normal pb-0.5">
                          <span className="text-[#3fb950] select-none font-normal">$</span>
                          <span className="text-[#f0f6fc] font-normal">{line.text.replace('$ ', '')}</span>
                        </div>
                      ) : line.type === 'dim' ? (
                        <div className="text-[#6e7681] text-[11.5px] sm:text-[12px] font-normal pl-4 pb-1">
                          {line.text}
                        </div>
                      ) : line.type === 'success' ? (
                        <div className="flex items-center justify-between gap-2.5 mt-2 bg-[#238636]/15 p-2.5 rounded-md border border-[#238636]/40 text-xs sm:text-[13px] font-normal">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#3fb950] text-sm select-none">✓</span>
                            <span className="text-[#8b949e] text-xs font-mono select-none">{line.ts}</span>
                            <span className="text-[#f0f6fc]">{line.action}</span>
                            <span className="text-[#3fb950] underline underline-offset-2">{line.target}</span>
                          </div>
                          {line.badge && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#238636]/30 text-[#3fb950] border border-[#238636]/50 font-normal shrink-0">
                              ready · {line.badge}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 py-0.5 hover:bg-[#161b22]/30 px-1 rounded transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[#3fb950] text-xs select-none">✓</span>
                            <span className="text-[#6e7681] select-none text-xs font-mono">
                              {line.ts}
                            </span>
                            <span className="text-[#c9d1d9] truncate">
                              {line.action}
                              {line.target && (
                                <span className="text-[#f0f6fc] font-medium ml-1.5 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d] text-[11.5px]">
                                  {line.target}
                                </span>
                              )}
                            </span>
                          </div>
                          {line.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10.5px] font-mono bg-[#161b22] border border-[#30363d] text-[#8b949e] font-normal shrink-0">
                              {line.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {!terminalDone && (
                    <span className="inline-block w-[7px] h-[14px] bg-[#2ea44f] animate-pulse rounded-[1px] align-middle ml-1 mt-0.5"></span>
                  )}
                </div>

                <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${terminalDone ? 'bg-[#3fb950]' : 'bg-[#d29922] animate-pulse'}`}></span>
                    <span className="text-[#c9d1d9]">
                      {terminalDone ? 'deploy complete · 15.2s' : `running step ${visibleLines.length}/${PIPELINE_LINES.length}`}
                    </span>
                  </div>
                  <span className="text-[#484f58]">bash · utf-8 · cgroups v2</span>
                </div>
              </div>
            </div>

            <ArchitectureCanvas />

            {/* Feature Highlights Grid (Elevated Cards) */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-[#161b22] border border-[#30363d] hover:border-[#444c56] rounded-[6px] p-4 space-y-1.5 transition-colors duration-150 cursor-default shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Zap className="w-3.5 h-3.5 text-[#d29922]" />
                  <span>Zero-Config Builds</span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  Automatic language detection for Node.js, Python, Vite, Next.js, and custom Dockerfiles.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] hover:border-[#444c56] rounded-[6px] p-4 space-y-1.5 transition-colors duration-150 cursor-default shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Lock className="w-3.5 h-3.5 text-[#2ea44f]" />
                  <span>Fernet Encryption</span>
                </div>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  API keys and environment variables are symmetrically encrypted at rest in Supabase.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] hover:border-[#444c56] rounded-[6px] p-4 space-y-1.5 transition-colors duration-150 cursor-default shadow-sm">
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
      </main>

      {/* 3. FOOTER (Elevated Layer) */}
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
