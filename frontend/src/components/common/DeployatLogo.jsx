import React from 'react';

export default function DeployatLogo({ className = "w-8 h-8" }) {
  return (
    <div className={`${className} rounded-lg bg-[#238636] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#238636]/30 transition-transform hover:scale-105`}>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.5L2.5 19.5H8.5L12 12.5L15.5 19.5H21.5L12 2.5Z" />
      </svg>
    </div>
  );
}
