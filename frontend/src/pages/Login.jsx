import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Activity, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0d1117] text-[#c9d1d9] px-4 py-12 antialiased">
      
      {/* GitHub Native Dark Card */}
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-[6px] shadow-sm overflow-hidden">

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
            Deploy in seconds
          </h1>
          
          {/* Description */}
          <p className="text-xs sm:text-sm text-[#8b949e] max-w-sm mb-6 leading-relaxed">
            Push code to GitHub. We automatically build the Docker container, configure routing, and serve your app.
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

          {/* Clean Flat Features Row with Vertical Dividers */}
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

        {/* Flat GitHub Status Footer */}
        <div className="px-6 py-3 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ea44f]"></span>
            <span className="text-[#8b949e]">All systems operational</span>
          </div>
          <span className="font-mono text-[11px] text-[#8b949e]">OAuth 2.0</span>
        </div>

      </div>

      {/* Footer Note */}
      <footer className="mt-6 text-center text-xs text-[#8b949e]">
        <p>Deployat • Mini-PaaS • Localhost & Cloud Ready</p>
      </footer>

    </div>
  );
}
