import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function LogsTab({
  selectedProject,
  getProjectDisplayName,
  logSessions,
  selectedLogSessionIndex,
  setSelectedLogSessionIndex,
  displayedLogs,
  handleCopyLogs,
  copiedLogs,
  logsContainerRef,
  handleLogsScroll,
  getLogColor
}) {
  if (!selectedProject) return null;

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#3fb950]" />
            Logs
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">Streaming build and runtime container logs in real time.</p>
        </div>

        {/* 3 Recent Log Sessions Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider mr-1 hidden sm:inline">
            History:
          </span>
          {logSessions.length === 0 ? (
            <div className="text-xs font-mono text-[#8b949e] italic px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d]">
              No build history
            </div>
          ) : (
            logSessions.map((session, idx) => (
              <button
                key={session.id}
                onClick={() => setSelectedLogSessionIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer border ${
                  selectedLogSessionIndex === idx
                    ? 'bg-[#21262d] text-[#f0f6fc] border-[#2ea043] shadow-sm'
                    : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9] hover:bg-[#21262d]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  session.isLatest ? 'bg-[#3fb950]' : session.hasFailed ? 'bg-[#f85149]' : 'bg-[#8b949e]'
                }`} />
                <span>{session.title}</span>
                {session.isLatest && (
                  <span className="text-[9px] uppercase font-bold text-[#3fb950] bg-[#238636]/15 px-1.5 py-0.2 rounded border border-[#238636]/30">
                    Active
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col bg-[#010409] border border-[#30363d] rounded-xl overflow-hidden font-mono shadow-2xl h-[calc(100vh-210px)] min-h-[520px]">
        {/* Terminal Header */}
        <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#f85149]"></div>
            <div className="w-3 h-3 rounded-full bg-[#d29922]"></div>
            <div className="w-3 h-3 rounded-full bg-[#3fb950]"></div>
            <span className="ml-2 text-xs text-[#8b949e]">
              tty1 • {getProjectDisplayName(selectedProject)}
              {logSessions.length > 0 && ` [Session ${logSessions[selectedLogSessionIndex]?.buildNumber || 1}]`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {displayedLogs.length > 0 && (
              <button
                onClick={handleCopyLogs}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-mono transition-colors cursor-pointer"
                title="Copy session logs to clipboard"
              >
                {copiedLogs ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                    <span className="text-[#3fb950] font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                    <span>Copy Logs</span>
                  </>
                )}
              </button>
            )}
            <span className="text-xs text-[#484f58]">UTF-8</span>
          </div>
        </div>

        {/* Terminal Scroll Body */}
        <div 
          ref={logsContainerRef} 
          onScroll={handleLogsScroll} 
          className="flex-1 p-5 overflow-y-auto space-y-1.5 font-mono text-[13px] sm:text-[13.5px] leading-[1.8]"
        >
          {displayedLogs.length === 0 ? (
            <p className="text-[#8b949e] italic text-sm">No logs recorded for this session yet.</p>
          ) : (
            displayedLogs.map((log) => (
              <div key={log.id} className={getLogColor(log.log_text)}>
                {log.log_text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
