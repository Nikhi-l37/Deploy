import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  Activity, ShieldCheck, Zap, Globe, ArrowRight, GitBranch, 
  Terminal, ArrowLeft, Layers, Server, Lock, ExternalLink
} from 'lucide-react';

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);
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

            {/* 3-Step Visual Git Pipeline */}
            <div className="max-w-4xl mx-auto pt-6">
              <div className="text-left mb-4">
                <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider font-mono">
                  Deployment Pipeline Workflow
                </span>
              </div>

              {/* Pipeline Nodes Container */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  
                  {/* Step 1: Git Push */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                    <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8b949e]">01</span>
                      <h3 className="text-sm font-semibold text-[#f0f6fc]">Push to GitHub</h3>
                    </div>
                    <p className="text-xs text-[#8b949e] leading-relaxed">
                      Push to your <code className="bg-[#0d1117] px-1 py-0.5 rounded text-[#58a6ff] border border-[#30363d]">main</code> branch. HMAC-SHA256 webhooks notify Deployly instantly.
                    </p>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                      Webhook Trigger
                    </span>
                  </div>

                  {/* Step 2: Auto Build & Route */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                    <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#2ea44f]">
                      <Server className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8b949e]">02</span>
                      <h3 className="text-sm font-semibold text-[#f0f6fc]">Auto Build & Isolation</h3>
                    </div>
                    <p className="text-xs text-[#8b949e] leading-relaxed">
                      Worker detects runtime, generates multi-stage Dockerfile, and injects Fernet encrypted secrets.
                    </p>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                      Docker Engine + Redis
                    </span>
                  </div>

                  {/* Step 3: Production Live */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                    <div className="w-10 h-10 rounded-[6px] bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#bc8cff]">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8b949e]">03</span>
                      <h3 className="text-sm font-semibold text-[#f0f6fc]">Instant Live URL</h3>
                    </div>
                    <p className="text-xs text-[#8b949e] leading-relaxed">
                      Nginx config is hot-reloaded. Your application is live with wake-on-demand and auto-sleep.
                    </p>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                      Nginx Reverse Proxy
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Zap className="w-4 h-4 text-[#d29922]" />
                  <span>Zero-Config Builds</span>
                </div>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Automatic language detection for Node.js, Python, Vite, Next.js, and custom Dockerfiles.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Lock className="w-4 h-4 text-[#2ea44f]" />
                  <span>Fernet Encryption</span>
                </div>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  API keys and environment variables are symmetrically encrypted at rest in Supabase.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-[6px] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc]">
                  <Layers className="w-4 h-4 text-[#58a6ff]" />
                  <span>Strict Resource Limits</span>
                </div>
                <p className="text-xs text-[#8b949e] leading-relaxed">
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
