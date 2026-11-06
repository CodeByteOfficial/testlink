import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Trash2, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  Settings2,
  FileCode2,
  FileText,
  Files
} from 'lucide-react';
import { ACCEPT_FILE_TYPES, SUPPORTED_EXTENSIONS } from '../utils/fileParser';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function UploadSection({
  file,
  fileFormat,
  sheetNames,
  selectedSheet,
  onSheetChange,
  onFileSelect,
  onRemoveFile,
  onConvert,
  isConverting,
  isConverted,
  totalRecords,
  rootTag,
  setRootTag,
  recordTag,
  setRecordTag,
  error,
  onSwitchToBulk
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleValidateAndSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleValidateAndSelect(selectedFile);
    }
  };

  const handleValidateAndSelect = (selectedFile) => {
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      onFileSelect(null, `Unsupported format "${ext}". Please upload .csv, .xlsx, .xls, .tsv, or .json files.`);
      return;
    }

    onFileSelect(selectedFile, null);
  };

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const getFormatBadge = (fmt) => {
    switch (fmt) {
      case 'xlsx':
      case 'xls':
        return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">{fmt} Excel</span>;
      case 'json':
        return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">JSON</span>;
      case 'tsv':
        return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">TSV</span>;
      default:
        return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">CSV</span>;
    }
  };

  const getFormatIcon = (fmt) => {
    if (fmt === 'xlsx' || fmt === 'xls') {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    }
    if (fmt === 'json') {
      return <FileCode2 className="w-6 h-6 text-purple-600" />;
    }
    return <FileText className="w-6 h-6 text-blue-600" />;
  };

  return (
    <section className="bg-slate-900/90 rounded-2xl border border-blue-500/20 shadow-2xl p-6 lg:p-8 transition-all backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center font-mono">1</span>
            Upload File (CSV, Excel XLSX / XLS, TSV, or JSON)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Drag and drop your spreadsheet or test case file to convert it into a single clean XML file.
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowTagOptions(!showTagOptions)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              XML Tags Config
            </button>
            <button
              type="button"
              onClick={onRemoveFile}
              disabled={isConverting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove File
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_FILE_TYPES}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/30 scale-[0.99] shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              : 'border-slate-800 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900/70 shadow-lg'
          }`}
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-inner group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {isDragOver ? 'Drop your file here' : 'Drag and drop your file here'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 mb-5">
            Supported formats: <strong className="text-cyan-300">.csv</strong>, <strong className="text-cyan-300">.xlsx</strong>, <strong className="text-cyan-300">.xls</strong>, <strong className="text-cyan-300">.tsv</strong>, or <strong className="text-cyan-300">.json</strong>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerBrowse();
              }}
              className="inline-flex items-center px-5 py-2.5 text-xs font-bold rounded-xl text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Browse Single File
            </button>
            {onSwitchToBulk && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitchToBulk();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-cyan-300 bg-slate-800/80 hover:bg-slate-700/80 border border-cyan-500/30 transition-all shadow-md cursor-pointer"
              >
                <Files className="w-4 h-4 text-cyan-400" />
                Bulk Upload (Multi-Suite)
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Processed 100% locally in your browser &bull; Preserves raw numbers, leading zeros, and Unicode
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Information Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                {getFormatIcon(fileFormat)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate text-base" title={file.name}>
                    {file.name}
                  </span>
                  {getFormatBadge(fileFormat)}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                  <span>Size: <strong className="text-cyan-300">{formatBytes(file.size)}</strong></span>
                  {totalRecords !== null && (
                    <span>Records: <strong className="text-cyan-300">{totalRecords.toLocaleString()}</strong></span>
                  )}
                  <span className="hidden sm:inline">
                    Modified: {new Date(file.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto shrink-0">
              {/* Sheet selector if Excel workbook has multiple sheets */}
              {sheetNames && sheetNames.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-medium">Sheet:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => onSheetChange(e.target.value)}
                    disabled={isConverting}
                    className="bg-transparent font-semibold text-cyan-300 focus:outline-none cursor-pointer"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name} className="bg-slate-900 text-white">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={triggerBrowse}
                disabled={isConverting}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* XML Tag Configuration Drawer */}
          {showTagOptions && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Customize XML Tags
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Root Element Name
                  </label>
                  <input
                    type="text"
                    value={rootTag}
                    onChange={(e) => setRootTag(e.target.value.replace(/[^\w-]/g, ''))}
                    placeholder="testcases"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-cyan-300"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">e.g. &lt;testcases&gt;</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Item / Row Element Name
                  </label>
                  <input
                    type="text"
                    value={recordTag}
                    onChange={(e) => setRecordTag(e.target.value.replace(/[^\w-]/g, ''))}
                    placeholder="testcase"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-cyan-300"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">e.g. &lt;testcase&gt;</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              {totalRecords > 0 ? (
                <span>
                  Ready to combine <strong className="text-white">{totalRecords.toLocaleString()} records</strong> into a single <strong className="text-cyan-300">.xml</strong> file under &lt;{rootTag || 'testcases'}&gt;.
                </span>
              ) : (
                <span>Validating file structure...</span>
              )}
            </div>

            <button
              type="button"
              onClick={onConvert}
              disabled={isConverting || !totalRecords || totalRecords === 0}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer ${
                isConverting || !totalRecords || totalRecords === 0
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Converting to XML...</span>
                </>
              ) : isConverted ? (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-950" />
                  <span>Re-convert to XML</span>
                </>
              ) : (
                <>
                  <span>Convert File to XML</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold">Validation Error:</strong> {error}
          </div>
        </div>
      )}
    </section>
  );
}
