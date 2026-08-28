import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function LogsTab({
  selectedProject,
  getProjectDisplayName,
  displayedLogs,
  handleCopyLogs,
  copiedLogs,
  logsContainerRef,
  handleLogsScroll,
  getLogColor
}) {
  if (!selectedProject) return null;

  // Parses [15:19:11] [BUILD] ... into structured columns
  const parseLogLine = (logText) => {
    if (!logText) return { timestamp: null, tag: null, message: '' };
    const match = logText.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[([A-Z_]+)\]\s*)?(.*)$/);
    if (match) {
      return {
        timestamp: match[1],
        tag: match[2] || null,
        message: match[3] || ''
      };
    }
    return { timestamp: null, tag: null, message: logText };
  };

  const isRunning = selectedProject.status === 'RUNNING';
  const isBuilding = selectedProject.status === 'BUILDING';

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl">
      
      {/* 1. HEADER & SESSION SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#58a6ff]" />
            Logs
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">Streaming build output and runtime container logs in real time.</p>
        </div>
      </div>

      {/* 2. MODERN TERMINAL LOG STREAM */}
      <div className="flex flex-col bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden shadow-sm h-[calc(100vh-220px)] min-h-[520px]">
        
        {/* Sleek Terminal Toolbar */}
        <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-[#f0f6fc] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-[#58a6ff] animate-ping' : isRunning ? 'bg-[#3fb950]' : 'bg-[#8b949e]'}`} />
              {getProjectDisplayName(selectedProject)}
              <span className="text-[#8b949e] font-normal font-sans">
                ({displayedLogs.length} lines)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {displayedLogs.length > 0 && (
              <button
                onClick={handleCopyLogs}
                className="px-2.5 py-1 text-xs font-mono text-[#8b949e] hover:text-[#f0f6fc] rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Copy all logs"
              >
                {copiedLogs ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                    <span className="text-[#3fb950]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Structured Column Log Rows */}
        <div 
          ref={logsContainerRef} 
          onScroll={handleLogsScroll} 
          className="flex-1 p-3 sm:p-4 overflow-y-auto font-mono text-xs sm:text-[13px] leading-relaxed select-text divide-y divide-[#161b22]"
        >
          {displayedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#8b949e] italic text-xs">
              No logs available for this session.
            </div>
          ) : (
            displayedLogs.map((log, index) => {
              const { timestamp, tag, message } = parseLogLine(log.log_text);
              const text = log.log_text || '';
              const isError = text.includes('Error:') || text.includes('FAILED') || text.includes('CRASH');

              return (
                <div 
                  key={log.id || index}
                  className={`flex items-start gap-3 py-1 px-2 rounded hover:bg-[#161b22] transition-colors ${
                    isError ? 'bg-[#da3633]/10 text-[#f85149]' : ''
                  }`}
                >
                  {/* Timestamp Column */}
                  {timestamp && (
                    <span className="text-[#6e7681] text-[11px] shrink-0 font-mono pt-0.5 select-none w-16">
                      {timestamp}
                    </span>
                  )}

                  {/* Stage Tag Badge */}
                  {tag && (
                    <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 px-1.5 py-0.2 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] select-none">
                      {tag}
                    </span>
                  )}

                  {/* Log Content Message */}
                  <div className={`flex-1 break-all ${getLogColor(text)}`}>
                    {message || text}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
