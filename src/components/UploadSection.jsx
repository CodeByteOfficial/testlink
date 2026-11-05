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
  FileText
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
  error
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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
            Upload File (CSV, Excel XLSX / XLS, TSV, or JSON)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop your spreadsheet or data file to convert it into a single clean XML file.
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowTagOptions(!showTagOptions)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              XML Tags Config
            </button>
            <button
              type="button"
              onClick={onRemoveFile}
              disabled={isConverting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
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
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 bg-slate-50/30'
          }`}
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {isDragOver ? 'Drop your file here' : 'Drag and drop your file here'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Supported formats: <strong className="text-slate-700">.csv</strong>, <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong>, <strong className="text-slate-700">.tsv</strong>, or <strong className="text-slate-700">.json</strong>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerBrowse();
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Browse File
          </button>
          <p className="text-xs text-slate-400 mt-4">
            Processed 100% locally in your browser &bull; Preserves raw numbers, leading zeros, and Unicode
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Information Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {getFormatIcon(fileFormat)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 truncate text-base" title={file.name}>
                    {file.name}
                  </span>
                  {getFormatBadge(fileFormat)}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>Size: <strong className="text-slate-700">{formatBytes(file.size)}</strong></span>
                  {totalRecords !== null && (
                    <span>Records: <strong className="text-slate-700">{totalRecords.toLocaleString()}</strong></span>
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
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-500 font-medium">Sheet:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => onSheetChange(e.target.value)}
                    disabled={isConverting}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
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
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Change File
              </button>
            </div>
          </div>

          {/* XML Tag Configuration Drawer */}
          {showTagOptions && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-blue-600" />
                Customize XML Tags
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Root Element Name
                  </label>
                  <input
                    type="text"
                    value={rootTag}
                    onChange={(e) => setRootTag(e.target.value.replace(/[^\w-]/g, ''))}
                    placeholder="records"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">e.g. &lt;records&gt;</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Item / Row Element Name
                  </label>
                  <input
                    type="text"
                    value={recordTag}
                    onChange={(e) => setRecordTag(e.target.value.replace(/[^\w-]/g, ''))}
                    placeholder="record"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">e.g. &lt;record&gt;</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {totalRecords > 0 ? (
                <span>
                  Ready to combine <strong>{totalRecords.toLocaleString()} records</strong> into a single <strong>.xml</strong> file under &lt;{rootTag || 'records'}&gt;.
                </span>
              ) : (
                <span>Validating file structure...</span>
              )}
            </div>

            <button
              type="button"
              onClick={onConvert}
              disabled={isConverting || !totalRecords || totalRecords === 0}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all ${
                isConverting || !totalRecords || totalRecords === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-500/25'
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Converting to XML...</span>
                </>
              ) : isConverted ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white" />
                  <span>Re-convert to XML</span>
                </>
              ) : (
                <>
                  <span>Convert File to XML</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold">Validation Error:</strong> {error}
          </div>
        </div>
      )}
    </section>
  );
}
