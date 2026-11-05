import React from 'react';
import { FileCode, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ onLoadSample, hasUploadedFile }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Universal File to XML Converter
                </h1>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">CSV</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 font-mono">XLSX</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 font-mono">XLS</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 font-mono">TSV</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 font-mono">JSON</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Convert CSV, Excel (XLSX/XLS), TSV, or JSON records into a single consolidated XML file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!hasUploadedFile && (
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                title="Load a sample file to test immediately"
              >
                <Zap className="w-4 h-4 text-blue-600" />
                Try Sample Data
              </button>
            )}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% In-Browser Privacy
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
