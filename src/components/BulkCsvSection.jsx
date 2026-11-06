import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Files, 
  Trash2, 
  Download, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileCode, 
  Check, 
  Copy, 
  FolderArchive, 
  FolderOpen, 
  ArrowRight,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  parseUniversalFile, 
  SUPPORTED_EXTENSIONS, 
  ACCEPT_FILE_TYPES, 
  getFileFormat 
} from '../utils/fileParser';
import { generateCombinedXml, downloadXmlFile } from '../utils/xmlGenerator';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFormatBadge(fmt) {
  switch (fmt?.toLowerCase()) {
    case 'xlsx':
    case 'xls':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">{fmt} Excel</span>;
    case 'json':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">JSON</span>;
    case 'tsv':
    case 'tab':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">TSV</span>;
    default:
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">CSV</span>;
  }
}

export default function BulkCsvSection({ onBackToSingle }) {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [downloadPath, setDownloadPath] = useState(String.raw`C:\Users\komal\Downloads`);
  
  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] = useState('');
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [jsonManifest, setJsonManifest] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [downloadedAll, setDownloadedAll] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [syncedPath, setSyncedPath] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

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
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    setError(null);
    setIsConverted(false);
    setConvertedFiles([]);
    setJsonManifest('');

    const validFiles = [];
    const invalidNames = [];

    newFiles.forEach(f => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        validFiles.push(f);
      } else {
        invalidNames.push(f.name);
      }
    });

    if (invalidNames.length > 0 && validFiles.length === 0) {
      setError(`Unsupported file format. Please upload supported files (${SUPPORTED_EXTENSIONS.join(', ')}).`);
      return;
    }

    if (invalidNames.length > 0) {
      setError(`Some files were skipped due to unsupported formats: ${invalidNames.slice(0, 3).join(', ')}${invalidNames.length > 3 ? '...' : ''}`);
    }

    setFiles(prev => {
      // Avoid exact duplicates by filename
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = validFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (files.length <= 1) {
      setIsConverted(false);
      setConvertedFiles([]);
      setJsonManifest('');
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setIsConverted(false);
    setConvertedFiles([]);
    setJsonManifest('');
    setError(null);
    setProgress(0);
    setCurrentProcessingFile('');
  };

  // Convert all uploaded files (CSV, XLSX, XLS, TSV, JSON, TXT) to XML
  const handleBulkConvert = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file to convert.');
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError(null);

    const results = [];
    const normalizedBasePath = downloadPath.trim().replace(/[\\/]+$/, '');

    for (let i = 0; i < files.length; i++) {
      const currentFile = files[i];
      const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
      const xmlName = `${baseName}.xml`;
      const fullFilePath = `${normalizedBasePath}\\${xmlName}`;
      const format = getFileFormat(currentFile.name);

      setCurrentProcessingFile(currentFile.name);

      try {
        // Universal parser handles CSV, XLSX, XLS, TSV, JSON, TXT, and XML
        const parsedResult = await parseUniversalFile(currentFile);
        let xmlContent = '';

        if (parsedResult.isAlreadyXml) {
          xmlContent = parsedResult.rawXml || (await currentFile.text());
        } else {
          const rows = parsedResult.data || [];
          const headerMappings = parsedResult.headerMappings || [];
          xmlContent = generateCombinedXml(rows, headerMappings, 'records', 'record');
        }

        results.push({
          id: i + 1,
          originalFileName: currentFile.name,
          xmlFileName: xmlName,
          suiteName: baseName,
          format: (parsedResult.isAlreadyXml ? 'XML' : format).toUpperCase(),
          filePath: fullFilePath,
          totalRecords: parsedResult.totalRecords || 1,
          xmlContent: xmlContent,
          status: 'success',
          convertedAt: new Date().toISOString()
        });
      } catch (err) {
        // Fallback recovery if file is already XML content disguised under another extension
        let fallbackXml = '';
        try {
          const text = await currentFile.text();
          if (text.includes('<?xml') || text.includes('<testcase') || text.includes('<record')) {
            fallbackXml = text.replace(/^\uFEFF/, '').trim();
          }
        } catch (_) {}

        if (fallbackXml) {
          const tcCount = (fallbackXml.match(/<testcase\b/gi) || []).length || (fallbackXml.match(/<record\b/gi) || []).length || 1;
          results.push({
            id: i + 1,
            originalFileName: currentFile.name,
            xmlFileName: xmlName,
            suiteName: baseName,
            format: 'XML',
            filePath: fullFilePath,
            totalRecords: tcCount,
            xmlContent: fallbackXml,
            status: 'success',
            convertedAt: new Date().toISOString()
          });
        } else {
          results.push({
            id: i + 1,
            originalFileName: currentFile.name,
            xmlFileName: xmlName,
            suiteName: baseName,
            format: format.toUpperCase(),
            filePath: fullFilePath,
            totalRecords: 0,
            xmlContent: '',
            status: 'error',
            error: err.message,
            convertedAt: new Date().toISOString()
          });
        }
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setConvertedFiles(results);

    // test.json stores all metadata fields (id, originalFileName, xmlFileName, suiteName, format, filePath, totalRecords, status, convertedAt)
    const manifestData = results.map(({ id, originalFileName, xmlFileName, suiteName, format, filePath, totalRecords, status, convertedAt }) => ({
      id,
      originalFileName,
      xmlFileName,
      suiteName,
      format,
      filePath,
      totalRecords,
      status,
      convertedAt
    }));

    const jsonString = JSON.stringify(manifestData, null, 2);
    setJsonManifest(jsonString);

    // Automatically sync updated JSON directly to playwright/tests/test.json
    await saveManifestToTestJson(jsonString);

    setCurrentProcessingFile('');
    setIsConverting(false);
    setIsConverted(true);
  };

  // Overwrites playwright/tests/test.json dynamically on local filesystem
  const saveManifestToTestJson = async (jsonData) => {
    if (!jsonData) return false;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/save-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonData
      });
      if (response.ok) {
        setSyncedPath(String.raw`C:\Users\komal\Projects\testlink\playwright\tests\test.json`);
        return true;
      }
    } catch (err) {
      console.warn('[Vite API] Could not auto-save to test.json:', err);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Handle dynamic download path changes and sync test.json
  const handlePathChange = (newPath) => {
    setDownloadPath(newPath);
    if (convertedFiles.length > 0) {
      const normalized = (newPath || String.raw`C:\Users\komal\Downloads`).trim().replace(/[\\/]+$/, '');
      const updatedFiles = convertedFiles.map(f => ({
        ...f,
        filePath: `${normalized}\\${f.xmlFileName}`
      }));
      setConvertedFiles(updatedFiles);
      const manifestData = updatedFiles.map(({ id, originalFileName, xmlFileName, suiteName, format, filePath, totalRecords, status, convertedAt }) => ({
        id,
        originalFileName,
        xmlFileName,
        suiteName,
        format,
        filePath,
        totalRecords,
        status,
        convertedAt
      }));
      const jsonString = JSON.stringify(manifestData, null, 2);
      setJsonManifest(jsonString);
      saveManifestToTestJson(jsonString);
    }
  };

  // Download all converted XML files individually (WITHOUT ZIP)
  const handleDownloadAllIndividualXmls = async () => {
    if (convertedFiles.length === 0) return;

    setIsDownloadingAll(true);
    setDownloadedAll(false);

    try {
      // 1. Recalculate manifest with current normalized downloadPath to ensure accurate paths
      const normalizedBasePath = (downloadPath || String.raw`C:\Users\komal\Downloads`).trim().replace(/[\\/]+$/, '');
      const updatedFiles = convertedFiles.map(f => ({
        ...f,
        filePath: `${normalizedBasePath}\\${f.xmlFileName}`
      }));
      setConvertedFiles(updatedFiles);

      const manifestData = updatedFiles.map(({ id, originalFileName, xmlFileName, suiteName, format, filePath, totalRecords, status, convertedAt }) => ({
        id,
        originalFileName,
        xmlFileName,
        suiteName,
        format,
        filePath,
        totalRecords,
        status,
        convertedAt
      }));
      const jsonString = JSON.stringify(manifestData, null, 2);
      setJsonManifest(jsonString);

      // 2. Overwrite playwright/tests/test.json dynamically with latest downloaded paths
      await saveManifestToTestJson(jsonString);

      // 3. Download each XML file individually with a 250ms stagger (No ZIP!)
      const successfulFiles = updatedFiles.filter(f => f.xmlContent);
      for (let i = 0; i < successfulFiles.length; i++) {
        const item = successfulFiles[i];
        downloadXmlFile(item.xmlContent, item.xmlFileName);
        if (i < successfulFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }

      setDownloadedAll(true);
      setTimeout(() => setDownloadedAll(false), 3000);
    } catch (err) {
      console.error('Failed to download individual XML files', err);
      setError('Failed to download individual XML files: ' + err.message);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Download individual XML file
  const handleDownloadSingleXml = (file) => {
    if (!file.xmlContent) return;
    downloadXmlFile(file.xmlContent, file.xmlFileName);
  };

  // Copy JSON manifest to clipboard
  const handleCopyJson = async () => {
    if (!jsonManifest) return;
    try {
      await navigator.clipboard.writeText(jsonManifest);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50 border border-indigo-200/80 rounded-2xl p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Files className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Bulk Multi-Format to XML Converter
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-600 text-white">Bulk Mode</span>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 font-mono">CSV</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 font-mono">XLSX</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-green-100 text-green-700 font-mono">XLS</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-700 font-mono">TSV</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 font-mono">JSON</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Upload multiple files across any supported format, batch-convert to TestLink XML, and export a JSON path mapping manifest.
            </p>
          </div>
        </div>

        {onBackToSingle && (
          <button
            type="button"
            onClick={onBackToSingle}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
          >
            Switch to Single File Mode
          </button>
        )}
      </div>

      {/* Target Directory Path Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            Target Download / Storage Directory Path (for JSON Manifest)
          </label>
          <span className="text-[11px] text-slate-500">Used by Playwright automation script</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={downloadPath}
            onChange={(e) => handlePathChange(e.target.value)}
            placeholder={String.raw`C:\Users\komal\Downloads`}
            className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          This path is stored in the exported JSON file so the Playwright automation script can locate each XML file on your disk.
        </p>
      </div>

      {/* Bulk Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-white/80 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_FILE_TYPES}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <span className="font-semibold text-slate-900 text-sm">
              Click to browse
            </span>
            <span className="text-slate-600 text-sm"> or drag and drop multiple files here</span>
          </div>

          <p className="text-xs text-slate-500">
            Supports <strong className="text-slate-700">.csv</strong>, <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong>, <strong className="text-slate-700">.tsv</strong>, <strong className="text-slate-700">.json</strong>, and <strong className="text-slate-700">.txt</strong>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Files className="w-4 h-4 text-indigo-600" />
                Uploaded Files ({files.length})
              </h3>
              <p className="text-xs text-slate-500">Ready for batch conversion to XML</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={clearAllFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>

              <button
                type="button"
                onClick={handleBulkConvert}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Converting ({progress}%)...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    Convert All ({files.length}) to XML
                  </>
                )}
              </button>
            </div>
          </div>

          {isConverting && currentProcessingFile && (
            <div className="px-5 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex items-center gap-2 text-xs text-indigo-900 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Processing: <strong className="font-mono">{currentProcessingFile}</strong></span>
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {files.map((f, idx) => {
              const base = f.name.replace(/\.[^/.]+$/, '');
              const fmt = getFileFormat(f.name);
              return (
                <div key={idx} className="p-3.5 sm:px-5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{f.name}</span>
                        {getFormatBadge(fmt)}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{formatBytes(f.size)}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-indigo-700">Suite: {base}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversion Results & Download Section */}
      {isConverted && convertedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Successfully Converted {convertedFiles.length} Files to XML
              </div>
              <h3 className="text-xl font-bold">Bulk Download &amp; JSON Manifest Ready</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                All files have been converted into TestLink-compatible XML schema. Click below to download all XML files along with their JSON path mapping file.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadAllIndividualXmls}
                disabled={isDownloadingAll}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    Downloading Individual Files...
                  </>
                ) : downloadedAll ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    All XMLs Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    Download All XML Files (Individual - No ZIP)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => saveManifestToTestJson(jsonManifest)}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-3 text-xs font-bold text-white bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 rounded-xl transition-all cursor-pointer"
                title="Force overwrite C:\Users\komal\Projects\testlink\playwright\tests\test.json"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4 text-amber-300" />
                    Sync to test.json
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Dynamic JSON Storage Active:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-800">playwright\tests\test.json</code> contains all converted file details (id, fileName, suiteName, format, filePath, totalRecords, status). No ZIP or JSON file is downloaded in the browser.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
              Overwrites on Every Download
            </span>
          </div>

          {/* Table of Converted Files */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Converted XML Files ({convertedFiles.length})
              </h4>
              <span className="text-[11px] text-slate-500">Each file downloads as an individual .xml file (No ZIP)</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {convertedFiles.map((item) => (
                <div key={item.id} className="p-3.5 px-5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-600" />
                      <span>{item.xmlFileName}</span>
                      {getFormatBadge(item.format)}
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800">
                        {item.totalRecords} records
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Path: {item.filePath}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingleXml(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download XML
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Manifest Viewer & Copy */}
          <div className="bg-slate-950 rounded-xl p-5 text-slate-200 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-400">
                <FileJson className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">playwright/tests/test.json</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded">
                  ● Dynamically Overwrites
                </span>
                <span className="text-[10px] text-slate-500">({convertedFiles.length} downloaded paths)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="max-h-64 overflow-y-auto text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
              {jsonManifest}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}
