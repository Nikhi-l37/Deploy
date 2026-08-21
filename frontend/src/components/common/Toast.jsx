import React from 'react';
import { Check, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function Toast({ toast, setToast }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 bg-[#161b22]/95 backdrop-blur-xl border border-[#30363d] text-[#f0f6fc] px-4 py-3 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.4)] min-w-[280px] max-w-[400px]">
      {toast.type === 'success' && (
        <div className="w-6 h-6 rounded-full bg-[#238636]/15 border border-[#238636]/30 flex items-center justify-center text-[#3fb950] shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}
      {toast.type === 'error' && (
        <div className="w-6 h-6 rounded-full bg-[#da3633]/15 border border-[#da3633]/30 flex items-center justify-center text-[#f85149] shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}
      {toast.type === 'info' && (
        <div className="w-6 h-6 rounded-full bg-[#388bfd]/15 border border-[#388bfd]/30 flex items-center justify-center text-[#58a6ff] shrink-0">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        </div>
      )}
      <div className="flex-1 text-[13px] font-medium text-[#f0f6fc] leading-snug">
        {toast.message}
      </div>
      <button 
        onClick={() => setToast(null)} 
        className="text-[#6e7681] hover:text-[#f0f6fc] p-1 rounded-md hover:bg-[#21262d] transition-colors ml-1 cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
