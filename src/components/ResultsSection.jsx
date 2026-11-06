import React, { useState, useMemo } from 'react';
import { 
  Download, 
  RotateCcw, 
  FileCode, 
  Check, 
  Copy, 
  FileCheck, 
  Code2, 
  Table as TableIcon,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { downloadXmlFile } from '../utils/xmlGenerator';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function ResultsSection({
  combinedXml,
  xmlFileName,
  totalRecords,
  records,
  headers,
  onClearAll,
  onOpenTestLink
}) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [downloadedFull, setDownloadedFull] = useState(false);
  const [activeTab, setActiveTab] = useState('xml'); // 'xml' | 'table'

  // XML file byte size
  const xmlBlobSize = useMemo(() => {
    if (!combinedXml) return 0;
    return new Blob([combinedXml], { type: 'application/xml' }).size;
  }, [combinedXml]);

  // Line count
  const lineCount = useMemo(() => {
    if (!combinedXml) return 0;
    return combinedXml.split('\n').length;
  }, [combinedXml]);

  const handleDownload = () => {
    downloadXmlFile(combinedXml, xmlFileName);
    setDownloadedFull(true);
    setTimeout(() => setDownloadedFull(false), 2500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedXml);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <section className="bg-slate-900/90 rounded-2xl border border-blue-500/20 shadow-2xl p-6 lg:p-8 space-y-6 backdrop-blur-md">
      
      {/* Primary Hero Header: Single XML File with All Records */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              All {totalRecords.toLocaleString()} Records Combined in One Single XML File
            </div>
            
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight flex items-center gap-3">
                <FileCode className="w-7 h-7 text-cyan-400 shrink-0" />
                <span className="break-all">{xmlFileName}</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Single file output: All {totalRecords.toLocaleString()} records are structured together inside this one XML document.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1 font-mono">
              <span className="bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                Total Records: <strong className="text-cyan-300">{totalRecords.toLocaleString()}</strong>
              </span>
              <span className="bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                Total XML Lines: <strong className="text-cyan-300">{lineCount.toLocaleString()}</strong>
              </span>
              <span className="bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                File Size: <strong className="text-cyan-300">{formatBytes(xmlBlobSize)}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons in Hero */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
              title="Copy entire XML content to clipboard"
            >
              {copiedFull ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copy XML</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 active:scale-[0.98] shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              title="Download the single XML file with all records"
            >
              {downloadedFull ? (
                <>
                  <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download XML File</span>
                </>
              )}
            </button>

            {/* Transfer to TestLink Top Action Button */}
            <button
              type="button"
              onClick={onOpenTestLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
              title="Open TestLink and transfer records"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Transfer to TestLink</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('xml')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'xml'
                ? 'bg-blue-950/80 text-cyan-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            Complete XML Preview ({lineCount.toLocaleString()} lines)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-blue-950/80 text-cyan-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Records Table View ({totalRecords.toLocaleString()} rows)
          </button>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Clear All &amp; Convert Another File
        </button>
      </div>

      {/* Tab 1: Direct Full XML Document Code Viewer */}
      {activeTab === 'xml' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Enclosed inside <code className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">&lt;records&gt; ... &lt;/records&gt;</code>
            </span>
            <span>Showing full single file output</span>
          </div>

          <div className="relative rounded-2xl bg-slate-900 text-slate-200 p-5 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner max-h-[550px]">
            <pre className="leading-relaxed">
              <code>{combinedXml}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Records Table View */}
      {activeTab === 'table' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 px-1">
            All of the rows below are bundled together in the single downloaded XML file.
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/90 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">#</th>
                    {headers && headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {records && records.slice(0, 50).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-center font-mono text-slate-400 font-medium">
                        {rec.id}
                      </td>
                      {headers && headers.map((h, colIdx) => (
                        <td key={colIdx} className="px-4 py-2.5 whitespace-nowrap max-w-xs truncate text-slate-800">
                          {rec.rowData && rec.rowData[h] !== undefined && rec.rowData[h] !== null
                            ? String(rec.rowData[h])
                            : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {records && records.length > 50 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                Showing first 50 rows of {records.length.toLocaleString()} records. All {records.length.toLocaleString()} rows are included in the downloaded XML file.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar at the Bottom: Contains Download and "Transfer to TestLink" as requested */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-600">
          Ready to save: <strong>{xmlFileName}</strong> ({formatBytes(xmlBlobSize)}, {totalRecords.toLocaleString()} records).
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download All Records (.xml)</span>
          </button>

          {/* New Button in the Last: "Transfer to TestLink" */}
          <button
            type="button"
            onClick={onOpenTestLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] shadow-md shadow-indigo-500/25 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-white" />
            <span>Transfer to TestLink</span>
          </button>
        </div>
      </div>

    </section>
  );
}
