import React from 'react';
import {
  Sparkles,
  Cpu,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';

export default function Header() {
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
                    Bloody Testers
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

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a
              href="#workspace"
              className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
            >
              Workspace
            </a>
            <a href="#features" className="hover:text-cyan-300 transition-colors">
              Features
            </a>
            <a href="#automation-runner" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <span>Runner Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </a>
          </nav>

          {/* Actions & Live Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Automation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-blue-500/20 text-xs font-semibold text-cyan-300 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-slate-200">Automation Suite</span>
            </div>

            {/* Glowing Status Pill */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Playwright Ready</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
