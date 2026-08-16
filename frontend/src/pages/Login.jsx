import React from 'react';
import { supabase } from '../supabase';
import { Code, Rocket, Sparkles } from 'lucide-react';

export default function Login() {
  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });
    
    if (error) {
      console.error('Error logging in:', error.message);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712]">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        {/* Top left purple glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
        {/* Bottom right blue glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[130px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
      </div>
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center transform transition-all duration-500 hover:scale-[1.02] animate-fade-in">
        
        {/* Logo Container */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shadow-xl">
            <Rocket className="w-10 h-10 text-blue-400 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-500" />
            <Sparkles className="absolute top-2 right-2 w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
        
        {/* Text content */}
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">
          Deployly
        </h1>
        <p className="text-slate-400 mb-10 text-sm leading-relaxed px-4">
          Push to GitHub. We handle the rest. <br/>
          Your own personal <span className="text-blue-400 font-semibold">Platform-as-a-Service</span>.
        </p>

        {/* GitHub Button */}
        <button 
          onClick={handleGithubLogin}
          className="group relative w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <Code className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
          Continue with GitHub
        </button>
        
        {/* Footer */}
        <p className="text-slate-600 text-xs mt-8">
          By continuing, you agree to our <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a> and <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
