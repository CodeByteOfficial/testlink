import React, { useState } from 'react';
import { Table, CheckCircle2, AlertTriangle, Layers, Tag, Eye } from 'lucide-react';

export default function CsvPreviewSection({
  parsedData,
  totalRecords,
  totalColumns,
  headers,
  headerMappings,
  previewRows,
  warnings,
  fileFormat
}) {
  const [showTagMapping, setShowTagMapping] = useState(false);

  if (!previewRows || previewRows.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-900/90 rounded-2xl border border-blue-500/20 shadow-2xl p-6 lg:p-8 space-y-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center font-mono">2</span>
            Data Preview &amp; Validation
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review parsed columns and preview the first 5 records before generating the XML file.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTagMapping(!showTagMapping)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          {showTagMapping ? 'Hide XML Tag Mappings' : 'View XML Tag Mappings'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/50 text-cyan-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Records</div>
            <div className="text-xl font-bold text-white">{totalRecords.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800/50 text-indigo-400 flex items-center justify-center shrink-0">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Columns</div>
            <div className="text-xl font-bold text-white">{totalColumns}</div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Validation Status</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              Valid Structure ({fileFormat ? fileFormat.toUpperCase() : 'Ready'})
            </div>
          </div>
        </div>
      </div>

      {/* Warnings if any */}
      {warnings && warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300">
          <div className="flex items-center gap-2 font-semibold text-sm mb-1 text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            File Notes &amp; Auto-adjustments
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 text-amber-200/80">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* XML Tag Mappings Accordion/Panel */}
      {showTagMapping && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-cyan-400" />
            Column Header to XML Tag Name Conversion
          </div>
          <p className="text-slate-400 mb-3">
            Spaces are converted to underscores, and invalid XML characters are automatically sanitized.
          </p>
          <div className="flex flex-wrap gap-2">
            {headerMappings.map((mapping, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 shadow-2xs"
              >
                <span className="text-slate-400 font-mono text-[11px]">{mapping.original}</span>
                <span className="text-cyan-400 font-bold">&rarr;</span>
                <span className="text-blue-700 font-mono font-semibold text-[11px]">
                  &lt;{mapping.sanitized}&gt;
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            First 5 Records Preview
          </div>
          <span className="text-xs text-slate-400">
            Showing {Math.min(5, totalRecords)} of {totalRecords} records
          </span>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xl bg-slate-950/60">
          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[11px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap w-12 text-center bg-slate-950 text-slate-400">#</th>
                  {headers.map((h, idx) => (
                    <th key={idx} className="px-4 py-3 whitespace-nowrap font-medium text-slate-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                {previewRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-2.5 text-center font-mono text-cyan-400 font-medium whitespace-nowrap bg-slate-950">
                      {rowIdx + 1}
                    </td>
                    {headers.map((h, colIdx) => {
                      const val = row[h];
                      const isEmpty = val === undefined || val === null || String(val).trim() === '';
                      return (
                        <td key={colIdx} className="px-4 py-2.5 whitespace-nowrap max-w-xs truncate">
                          {isEmpty ? (
                            <span className="text-slate-600 italic text-[11px]">&lt;empty&gt;</span>
                          ) : (
                            <span className="text-slate-200">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
