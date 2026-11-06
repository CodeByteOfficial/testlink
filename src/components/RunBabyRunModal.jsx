import React, { useEffect, useRef } from 'react';
import { Play, Square, X, Terminal, RefreshCw, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

export default function RunBabyRunModal({
  isOpen,
  onClose,
  isRunning,
  status,
  logs,
  onStart,
  onStop
}) {
  const [copied, setCopied] = React.useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logs || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Automation Runner — "Run baby run"
                </h3>
                {isRunning ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Executing Suites...
                  </span>
                ) : status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                ) : status === 'failed' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Failed / Stopped
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executes <code className="font-mono text-pink-400 font-bold">npm run login</code> through all test suites defined in <code className="font-mono text-indigo-300">test.json</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Copy Output"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Terminal Output */}
        <div className="flex-1 bg-slate-950 p-4 font-mono text-xs overflow-y-auto min-h-[320px] max-h-[500px] select-text space-y-1">
          <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-pink-400" />
              Live Console Output ($ npm run login)
            </span>
            <span className="text-[10px] text-slate-500">Auto-scrolls on new log lines</span>
          </div>

          {logs ? (
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300 pt-2">
              {logs}
            </pre>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 text-slate-700" />
              <p className="text-xs">Click "Run baby run" to start executing all test suites from test.json.</p>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isRunning ? (
              <span className="text-amber-300 font-medium flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Browser running: Steps 0, 1, 2 once &rarr; looping Step 3 to 3.25 for all test suites
              </span>
            ) : status === 'completed' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Execution finished successfully!
              </span>
            ) : (
              <span>Ready to run Playwright TestLink Automation</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop Script
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Run baby run
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
