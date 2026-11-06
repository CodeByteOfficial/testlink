import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Cpu, 
  Play, 
  FileCode, 
  CheckCircle2, 
  Files, 
  Database,
  Terminal,
  Activity
} from 'lucide-react';

export default function HeroSection({ activeMode, setActiveMode, onScrollToWorkspace }) {
  return (
    <div className="relative overflow-hidden pt-8 pb-16">
      
      {/* Radiant Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Pill Tag (Matching Screenshot Tag) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-blue-500/30 text-xs text-slate-300 shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md mb-8 hover:border-cyan-400/60 transition-all cursor-default">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white font-mono shadow-xs">
            New
          </span>
          <span className="text-slate-300 font-medium">
            All-in-one TestLink &amp; Playwright automation engine
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        {/* Hero Headline (Exact text requested by user with editorial serif italic) */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Welcome to the{' '}
          <span className="font-serif-italic font-normal tracking-normal bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(59,130,246,0.65)]">
            Automation World
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Transform raw test cases into TestLink-compatible XML schema in seconds, automatically map dynamic disk paths in <code className="text-cyan-300 font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-blue-500/30">test.json</code>, and trigger end-to-end Playwright automation with zero hassle.
        </p>

        {/* Dual CTA Buttons (Matching White Primary & Glass Secondary Style from Screenshot) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveMode('bulk');
              onScrollToWorkspace();
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span>Get Started</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('bulk');
              onScrollToWorkspace();
            }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400/50 backdrop-blur-md shadow-lg transition-all hover:text-white cursor-pointer group"
          >
            <span>Launch "Run baby run"</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Trust Badges / Checkpoint Row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>1-second XML delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Dynamic manifest sync</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero data loss guarantee</span>
          </div>
        </div>

        {/* 🌟 3D Glowing Cyber Wave / Glass Torus Graphic (Matching Screenshot Visual Centerpiece) */}
        <div className="relative mt-12 mb-16 max-w-4xl mx-auto flex items-center justify-center">
          <div className="relative w-full aspect-[21/9] max-h-[340px] flex items-center justify-center overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950 shadow-[0_0_80px_-20px_rgba(37,99,235,0.4)]">
            
            {/* Glowing Orb inside graphic */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-500/30 to-blue-600/40 blur-3xl -top-10"></div>
            <div className="absolute w-96 h-40 rounded-full bg-blue-600/20 blur-2xl bottom-0"></div>

            {/* Futuristic SVG Cyber Ribbon / Liquid Glass Loop */}
            <svg 
              viewBox="0 0 1000 400" 
              className="w-full h-full object-cover filter drop-shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-float-wave"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cyberRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#0066ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="cyberRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#1e40af" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Glass Curves */}
              <path 
                d="M 50 250 C 250 80, 450 340, 700 180 C 850 80, 950 220, 980 260 C 850 380, 600 280, 400 320 C 200 360, 100 310, 50 250 Z" 
                fill="url(#cyberRibbonGrad2)" 
                opacity="0.45"
              />

              {/* Foreground Radiant Torus Loop */}
              <path 
                d="M 30 200 C 180 30, 420 80, 520 200 C 620 320, 820 370, 970 200 C 820 20, 580 340, 480 200 C 380 60, 180 370, 30 200 Z" 
                fill="none" 
                stroke="url(#cyberRibbonGrad1)" 
                strokeWidth="14" 
                strokeLinecap="round"
                filter="url(#glowEffect)"
              />

              <path 
                d="M 60 190 C 200 40, 440 90, 520 200 C 600 310, 800 350, 940 210" 
                fill="none" 
                stroke="#a5f3fc" 
                strokeWidth="4" 
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Glowing Particle Nodes */}
              <circle cx="280" cy="110" r="5" fill="#ffffff" filter="url(#glowEffect)" />
              <circle cx="520" cy="200" r="7" fill="#67e8f9" filter="url(#glowEffect)" />
              <circle cx="760" cy="290" r="5" fill="#ffffff" filter="url(#glowEffect)" />
            </svg>

            {/* Floating Glass Label Overlay */}
            <div className="absolute bottom-5 inset-x-auto px-5 py-2 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md flex items-center gap-3 text-xs text-slate-300 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-mono text-cyan-300">Playwright Autonomous Runner Active</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Step 0 to 3.25 Automated Loop</span>
            </div>
          </div>
        </div>

        {/* Integration Badges / Ecosystem Partners (Matching screenshot logo ribbon) */}
        <div className="border-t border-b border-blue-500/10 py-6 mb-20">
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-4">
            Unified Engine Compatible With
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wider font-mono">
              <Database className="w-4 h-4 text-blue-400" />
              <span>TESTLINK</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wider font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>PLAYWRIGHT</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wider font-mono">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>CSV &amp; EXCEL</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wider font-mono">
              <Files className="w-4 h-4 text-purple-400" />
              <span>JSON MANIFEST</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wider font-mono">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>CHROMIUM</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 🚀 3 GLASSMORPHIC FEATURE CARDS (Matching Bottom Half of Screenshot) */}
        {/* ============================================================ */}
        <div id="features" className="space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-cyan-400">
            <span>Next-Gen Automation Suite</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Unlock the Full Potential of{' '}
            <span className="font-serif-italic font-normal bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              Your Test Automation
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Eliminate manual test suite imports, XML tagging errors, and repetitive regression runs with our automated bridge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-16">
          
          {/* Card 1: Seamless Integration */}
          <div className="group relative rounded-2xl p-7 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.25)] hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Seamless Integration
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Accepts CSV, XLSX, XLS, TSV, and JSON. Directly maps columns to TestLink's exact XML schema with step-by-step CDATA preservation.
            </p>
          </div>

          {/* Card 2: Enhanced Productivity */}
          <div className="group relative rounded-2xl p-7 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.25)] hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Enhanced Productivity
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Download individual XML files with the "I am the artist bro!" engine. Automatically maintains <code className="text-cyan-300 font-mono">test.json</code> with accurate local file paths.
            </p>
          </div>

          {/* Card 3: Superior Support / Autonomous Runner */}
          <div className="group relative rounded-2xl p-7 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.25)] hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-cyan-400 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Autonomous Runner
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Single-click "Run baby run" executes multi-suite loops, auto-detects Test Plan builds, assigns testers, and passes tests with live terminal streaming.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
