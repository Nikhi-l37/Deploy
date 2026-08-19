import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Activity, ShieldCheck, Zap, Globe, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0d1117] text-[#c9d1d9] px-4 py-12">
      
      {/* Background Ambient Glow & Grid Pattern */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
        {/* Top center emerald halo */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[550px] rounded-full bg-[#238636]/15 blur-[160px]"></div>
        {/* Subtle bottom corner ambient glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1f6feb]/10 blur-[150px]"></div>
        
        {/* Geometric Matrix Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#30363d1a_1px,transparent_1px),linear-gradient(to_bottom,#30363d1a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_70%,transparent_100%)]"></div>
      </div>
      
      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl shadow-[0_20px_50px_rgba(1,4,9,0.9),0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden transition-all duration-300">
        
        {/* Top Card Gradient Highlight Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#2ea043] to-transparent"></div>

        <div className="p-8 sm:p-10 flex flex-col items-center text-center">
          
          {/* Logo & Platform Pill */}
          <div className="relative mb-6 group">
            <div className="absolute -inset-1.5 bg-[#238636]/30 rounded-2xl blur-lg group-hover:bg-[#238636]/50 transition-all duration-500"></div>
            <div className="relative w-16 h-16 bg-[#0d1117] border border-[#30363d] rounded-2xl flex items-center justify-center shadow-xl text-white">
              <Activity className="w-8 h-8 text-[#3fb950] group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          
          {/* Main Title & Badges */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] mb-3 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
            <span className="text-[#f0f6fc] font-semibold">Deployat</span>
            <span>•</span>
            <span>Mini-PaaS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f6fc] tracking-tight mb-2">
            Deploy in seconds
          </h1>
          
          <p className="text-xs sm:text-sm text-[#8b949e] max-w-sm mb-8 leading-relaxed">
            Push code to GitHub. We automatically build the Docker container, configure routing, and serve your app.
          </p>

          {/* GitHub Login Button */}
          <button 
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="group relative w-full flex items-center justify-center gap-3 bg-[#238636] hover:bg-[#2ea043] active:bg-[#29903b] text-white font-semibold py-3 px-5 rounded-lg border border-[rgba(240,246,252,0.1)] shadow-[0_1px_0_rgba(27,31,36,0.1),0_0_20px_rgba(46,160,67,0.3)] hover:shadow-[0_0_25px_rgba(46,160,67,0.5)] transition-all duration-200 active:scale-[0.99] text-sm disabled:opacity-50"
          >
            {/* Official GitHub Octocat SVG */}
            <svg className="w-5 h-5 fill-current transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>{isLoading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            <ArrowRight className="w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Feature Highlights Bento Row */}
          <div className="mt-8 pt-6 border-t border-[#30363d] w-full grid grid-cols-3 gap-2 text-left">
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col justify-between">
              <Zap className="w-4 h-4 text-[#d29922] mb-1.5" />
              <span className="text-[11px] font-semibold text-[#f0f6fc] leading-tight">Instant Builds</span>
              <span className="text-[10px] text-[#8b949e]">Auto Docker</span>
            </div>
            
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col justify-between">
              <ShieldCheck className="w-4 h-4 text-[#3fb950] mb-1.5" />
              <span className="text-[11px] font-semibold text-[#f0f6fc] leading-tight">Encrypted</span>
              <span className="text-[10px] text-[#8b949e]">Fernet AES</span>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col justify-between">
              <Globe className="w-4 h-4 text-[#58a6ff] mb-1.5" />
              <span className="text-[11px] font-semibold text-[#f0f6fc] leading-tight">Live Proxy</span>
              <span className="text-[10px] text-[#8b949e]">Auto Nginx</span>
            </div>
          </div>
          
        </div>

        {/* Card Footer Bar */}
        <div className="px-6 py-3 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3fb950]"></span>
            <span>All systems operational</span>
          </div>
          <span className="font-mono text-[10px] text-[#484f58]">OAuth 2.0</span>
        </div>

      </div>

      {/* Footer Legal & Version */}
      <footer className="mt-8 text-center text-xs text-[#8b949e]">
        <p>Deployat • Self-Hosted Cloud Platform</p>
      </footer>

    </div>
  );
}
