import React from 'react';
import { 
  FileCode, 
  ShieldCheck, 
  Zap, 
  Files, 
  FileText, 
  Sparkles,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';

export default function Header({ onLoadSample, hasUploadedFile, activeMode = 'single', setActiveMode }) {
  return (
    <header className="bg-[#030712]/85 backdrop-blur-xl border-b border-blue-500/15 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950 border border-blue-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    welcome to the automation world
                  </span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-cyan-400 border border-blue-500/30 font-mono">
                  v2.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                Universal TestLink XML Converter &bull; Dynamic Manifest &bull; Autonomous Runner
              </p>
            </div>
          </div>

          {/* Navigation Links (Matching Screenshot Nav Style) */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a 
              href="#workspace" 
              onClick={() => setActiveMode && setActiveMode('single')} 
              className={`hover:text-cyan-300 transition-colors ${activeMode === 'single' ? 'text-cyan-400 font-bold' : ''}`}
            >
              Single Ingestion
            </a>
            <a 
              href="#workspace" 
              onClick={() => setActiveMode && setActiveMode('bulk')} 
              className={`hover:text-cyan-300 transition-colors ${activeMode === 'bulk' ? 'text-cyan-400 font-bold' : ''}`}
            >
              Bulk Suite
            </a>
            <a href="#features" className="hover:text-cyan-300 transition-colors">
              Features
            </a>
            <a href="#automation-runner" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <span>Runner Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </a>
          </nav>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-3">
            {setActiveMode && (
              <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-blue-500/20 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveMode('single')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeMode === 'single'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Single</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('bulk')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeMode === 'bulk'
                      ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bulk conversion & Autonomous Playwright Runner"
                >
                  <Files className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bulk</span>
                </button>
              </div>
            )}

            {!hasUploadedFile && activeMode === 'single' && (
              <button
                type="button"
                onClick={onLoadSample}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Load a sample test case file"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Sample
              </button>
            )}

            {/* Glowing Status Pill */}
            <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Playwright Ready</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
