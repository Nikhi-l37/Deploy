import React, { useState, useRef } from 'react';
import { Database, X, Plus, RefreshCw, Save, Eye, EyeOff, Upload, FileText } from 'lucide-react';

function parseEnvContent(content) {
  const vars = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    // Match KEY=VALUE (value can contain = signs)
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) {
      vars.push({ key, value });
    }
  }
  return vars;
}

export default function EnvironmentTab({
  selectedProject,
  envVars,
  setEnvVars,
  handleSaveEnvVars,
  isSavingEnv
}) {
  if (!selectedProject) return null;

  const [visibleVars, setVisibleVars] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef(null);

  const toggleVisibility = (idx) => {
    setVisibleVars(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseEnvContent(e.target.result);
      if (parsed.length === 0) return;
      mergeEnvVars(parsed);
    };
    reader.readAsText(file);
  };

  const mergeEnvVars = (newVars) => {
    // Merge: update existing keys, add new ones
    const existing = [...envVars].filter(ev => ev.key); // Remove empty rows
    const existingKeys = new Set(existing.map(ev => ev.key));
    
    for (const nv of newVars) {
      if (existingKeys.has(nv.key)) {
        // Update existing
        const idx = existing.findIndex(ev => ev.key === nv.key);
        existing[idx].value = nv.value;
      } else {
        existing.push(nv);
      }
    }
    
    if (existing.length === 0) existing.push({ key: '', value: '' });
    setEnvVars(existing);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return;
    const parsed = parseEnvContent(pasteContent);
    if (parsed.length > 0) {
      mergeEnvVars(parsed);
    }
    setPasteContent('');
    setShowPasteBox(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-[#bc8cff]" />
          Environment Variables
        </h2>
        <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
          Variables configured here are encrypted symmetrically with Fernet at rest and securely injected into the container at runtime.
        </p>
      </div>

      {/* .env File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
          isDragOver 
            ? 'border-[#58a6ff] bg-[#58a6ff]/10' 
            : 'border-[#30363d] hover:border-[#58a6ff]/50 bg-[#161b22]/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".env,.env.local,.env.production,.txt"
          className="hidden"
          onChange={(e) => {
            handleFileUpload(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <div className="flex items-center justify-center gap-3">
          <Upload className={`w-5 h-5 ${isDragOver ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
          <div className="text-left">
            <p className={`text-sm font-medium ${isDragOver ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'}`}>
              Drop .env file here or click to upload
            </p>
            <p className="text-xs text-[#8b949e]">
              Supports .env, .env.local, .env.production formats
            </p>
          </div>
        </div>
      </div>

      {/* Env Vars Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#30363d] bg-[#21262d] text-xs font-bold text-[#8b949e] uppercase tracking-wider">
          <div className="col-span-5">Key Name</div>
          <div className="col-span-5">Encrypted Value</div>
          <div className="col-span-2 text-center"></div>
        </div>
        
        <div className="p-5 space-y-3">
          {envVars.map((ev, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <input 
                  type="text" 
                  value={ev.key}
                  onChange={(e) => {
                    const newVars = [...envVars];
                    newVars[idx].key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                    setEnvVars(newVars);
                  }}
                  placeholder="e.g. DATABASE_URL"
                  className="input-field font-mono text-xs py-2 px-3"
                />
              </div>
              <div className="col-span-5 relative">
                <input 
                  type={visibleVars[idx] ? "text" : "password"} 
                  value={ev.value}
                  onChange={(e) => {
                    const newVars = [...envVars];
                    newVars[idx].value = e.target.value;
                    setEnvVars(newVars);
                  }}
                  placeholder="••••••••••••"
                  className="input-field font-mono text-xs py-2 px-3 pr-9 w-full"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(idx)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
                  title={visibleVars[idx] ? "Hide value" : "Show value"}
                >
                  {visibleVars[idx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="col-span-2 flex justify-center">
                <button 
                  onClick={() => {
                    const newVars = envVars.filter((_, i) => i !== idx);
                    if (newVars.length === 0) newVars.push({ key: '', value: '' });
                    setEnvVars(newVars);
                  }}
                  className="p-1.5 text-[#8b949e] hover:text-[#f85149] transition-colors rounded hover:bg-[#30363d] cursor-pointer"
                  title="Remove variable"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paste .env Content */}
      {showPasteBox && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder={"# Paste your .env content here\nDATABASE_URL=postgres://...\nJWT_SECRET=mysecret123\nPORT=3001"}
            className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs font-mono text-[#c9d1d9] placeholder-[#484f58] focus:border-[#58a6ff] focus:outline-none resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowPasteBox(false); setPasteContent(''); }}
              className="text-xs text-[#8b949e] hover:text-[#c9d1d9] px-3 py-1.5 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePasteSubmit}
              className="text-xs bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-1.5 rounded font-semibold cursor-pointer"
            >
              Add Variables
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
            className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Variable
          </button>
          <button 
            onClick={() => setShowPasteBox(!showPasteBox)}
            className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Paste .env
          </button>
        </div>
        <button onClick={handleSaveEnvVars} disabled={isSavingEnv} className="btn btn-primary text-xs font-semibold px-5 py-2.5">
          {isSavingEnv ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
