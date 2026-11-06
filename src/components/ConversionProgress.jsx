import React from 'react';
import { Loader2, CheckCircle2, FileCheck } from 'lucide-react';

export default function ConversionProgress({
  isConverting,
  progress,
  currentCount,
  totalRecords,
  isConverted,
  xmlFileName
}) {
  if (!isConverting && !isConverted) {
    return null;
  }

  const percent = Math.min(100, Math.max(0, progress));

  return (
    <section className="bg-slate-900/90 rounded-2xl border border-blue-500/20 shadow-2xl p-6 lg:p-8 space-y-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          {isConverting ? (
            <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 text-cyan-400 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-white">
              {isConverting ? 'Processing CSV Records...' : 'Single XML File Generated Successfully!'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConverting
                ? `Compiling row ${currentCount.toLocaleString()} of ${totalRecords.toLocaleString()} into XML...`
                : `Combined all ${totalRecords.toLocaleString()} records into ${xmlFileName || 'output.xml'}.`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-cyan-300">
            {percent}%
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-150 ${
            isConverting
              ? 'bg-gradient-to-r from-cyan-400 to-blue-600 animate-pulse'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {isConverted && !isConverting && (
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Single consolidated XML file is ready for download or preview.
          </div>
          <span className="text-slate-500">
            Every CSV row is structured inside the unified XML root container
          </span>
        </div>
      )}
    </section>
  );
}
