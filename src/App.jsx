import React from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BulkCsvSection from './components/BulkCsvSection';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-blue-600/30 selection:text-cyan-200">
      {/* Header with Dark Glass Navbar */}
      <Header />

      {/* 🌟 Futuristic Hero Section & 3 Feature Cards */}
      <HeroSection 
        onScrollToWorkspace={() => {
          document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Workspace Container */}
      <main id="workspace" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative">
        {/* Ambient Radial Spotlight */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        {/* Dedicated Universal Bulk XML Converter & Playwright Automation Suite */}
        <BulkCsvSection />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">welcome to the automation world</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">Direct TestLink &amp; Playwright Suite</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% In-Browser Privacy: Client-side processing only (no server upload)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
