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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
            Data Preview & Validation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review parsed columns and preview the first 5 records before generating the XML file.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTagMapping(!showTagMapping)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          {showTagMapping ? 'Hide XML Tag Mappings' : 'View XML Tag Mappings'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Records</div>
            <div className="text-xl font-bold text-slate-900">{totalRecords.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Columns</div>
            <div className="text-xl font-bold text-slate-900">{totalColumns}</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Validation Status</div>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
              Valid Structure ({fileFormat ? fileFormat.toUpperCase() : 'Ready'})
            </div>
          </div>
        </div>
      </div>

      {/* Warnings if any */}
      {warnings && warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-center gap-2 font-semibold text-sm mb-1 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            File Notes & Auto-adjustments
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 text-amber-700">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* XML Tag Mappings Accordion/Panel */}
      {showTagMapping && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-blue-600" />
            Column Header to XML Tag Name Conversion
          </div>
          <p className="text-slate-500 mb-3">
            Spaces are converted to underscores, and invalid XML characters are automatically sanitized.
          </p>
          <div className="flex flex-wrap gap-2">
            {headerMappings.map((mapping, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs"
              >
                <span className="text-slate-500 font-mono text-[11px]">{mapping.original}</span>
                <span className="text-blue-500 font-bold">&rarr;</span>
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
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            First 5 Records Preview
          </div>
          <span className="text-xs text-slate-400">
            Showing {Math.min(5, totalRecords)} of {totalRecords} records
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap w-12 text-center bg-slate-100">#</th>
                  {headers.map((h, idx) => (
                    <th key={idx} className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {previewRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-center font-mono text-slate-400 font-medium whitespace-nowrap bg-slate-50/50">
                      {rowIdx + 1}
                    </td>
                    {headers.map((h, colIdx) => {
                      const val = row[h];
                      const isEmpty = val === undefined || val === null || String(val).trim() === '';
                      return (
                        <td key={colIdx} className="px-4 py-2.5 whitespace-nowrap max-w-xs truncate">
                          {isEmpty ? (
                            <span className="text-slate-300 italic text-[11px]">&lt;empty&gt;</span>
                          ) : (
                            <span className="text-slate-800">{String(val)}</span>
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
