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
  ArrowRight
} from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { mapHeadersToXmlTags, generateCombinedXml, downloadXmlFile } from '../utils/xmlGenerator';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function BulkCsvSection({ onBackToSingle }) {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [downloadPath, setDownloadPath] = useState(String.raw`C:\Users\komal\Downloads\convertor`);
  
  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [jsonManifest, setJsonManifest] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);
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

    const csvFiles = newFiles.filter(f => {
      const name = f.name.toLowerCase();
      return name.endsWith('.csv') || name.endsWith('.txt');
    });

    if (csvFiles.length === 0) {
      setError('Please upload valid CSV (.csv) files.');
      return;
    }

    setFiles(prev => {
      // Avoid exact duplicates by filename
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = csvFiles.filter(f => !existingNames.has(f.name));
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
  };

  // Convert all uploaded CSVs to XML
  const handleBulkConvert = async () => {
    if (files.length === 0) {
      setError('Please upload at least one CSV file.');
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

      try {
        const textContent = await currentFile.text();
        const parsed = Papa.parse(textContent, {
          header: true,
          skipEmptyLines: 'greedy',
          dynamicTyping: false
        });

        const rows = parsed.data || [];
        const headers = parsed.meta.fields || [];
        const headerMappings = mapHeadersToXmlTags(headers);
        const xmlContent = generateCombinedXml(rows, headerMappings, 'records', 'record');

        results.push({
          id: i + 1,
          originalFileName: currentFile.name,
          xmlFileName: xmlName,
          suiteName: baseName,
          filePath: fullFilePath,
          totalRecords: rows.length,
          xmlContent: xmlContent,
          status: 'success',
          convertedAt: new Date().toISOString()
        });
      } catch (err) {
        results.push({
          id: i + 1,
          originalFileName: currentFile.name,
          xmlFileName: xmlName,
          suiteName: baseName,
          filePath: fullFilePath,
          totalRecords: 0,
          xmlContent: '',
          status: 'error',
          error: err.message,
          convertedAt: new Date().toISOString()
        });
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setConvertedFiles(results);

    // Create JSON manifest without raw xmlContent for clean storage
    const manifestData = results.map(({ id, originalFileName, xmlFileName, suiteName, filePath, totalRecords, status, convertedAt }) => ({
      id,
      originalFileName,
      xmlFileName,
      suiteName,
      filePath,
      totalRecords,
      status,
      convertedAt
    }));

    const jsonString = JSON.stringify(manifestData, null, 2);
    setJsonManifest(jsonString);

    setIsConverting(false);
    setIsConverted(true);
  };

  // Download all XML files and JSON manifest as a single ZIP bundle
  const handleDownloadZip = async () => {
    if (convertedFiles.length === 0) return;

    try {
      const zip = new JSZip();

      // Add each converted XML file
      convertedFiles.forEach(file => {
        if (file.xmlContent) {
          zip.file(file.xmlFileName, file.xmlContent);
        }
      });

      // Add the JSON manifest file
      zip.file('testlink_files_manifest.json', jsonManifest);

      // Generate ZIP blob
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `testlink_bulk_xmls_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Also directly trigger JSON download so user has the file immediately on disk
      handleDownloadJsonOnly();

      setDownloadedZip(true);
      setTimeout(() => setDownloadedZip(false), 3000);
    } catch (err) {
      console.error('Failed to create ZIP', err);
      setError('Failed to generate ZIP download: ' + err.message);
    }
  };

  // Download JSON manifest file separately
  const handleDownloadJsonOnly = () => {
    if (!jsonManifest) return;
    const blob = new Blob([jsonManifest], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'testlink_files_manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Bulk CSV to XML Converter
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-600 text-white">Bulk Mode</span>
            </h2>
            <p className="text-xs text-slate-600">
              Upload multiple CSV files, batch-convert to TestLink XML format, and download all files with a JSON path mapping manifest.
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
            onChange={(e) => setDownloadPath(e.target.value)}
            placeholder={String.raw`C:\Users\komal\Downloads\convertor`}
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
          accept=".csv, .txt, text/csv"
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
            <span className="text-slate-600 text-sm"> or drag and drop multiple CSV files here</span>
          </div>

          <p className="text-xs text-slate-500">
            Select as many <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">.csv</code> files as you want (e.g. <code className="font-mono text-slate-700">NEWCQ-4859_Javed.csv</code>)
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
                Uploaded CSV Files ({files.length})
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

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {files.map((f, idx) => {
              const base = f.name.replace(/\.[^/.]+$/, '');
              return (
                <div key={idx} className="p-3.5 sm:px-5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{f.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
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
                Successfully Converted {convertedFiles.length} CSV Files to XML
              </div>
              <h3 className="text-xl font-bold">Bulk Download &amp; JSON Manifest Ready</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                All XML files have been formatted with TestLink XML schema. Click below to download all XML files and their corresponding JSON path mapping file.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all active:scale-95"
              >
                {downloadedZip ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4 text-slate-950" />
                    Download All (XMLs + JSON ZIP)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadJsonOnly}
                className="inline-flex items-center gap-2 px-4 py-3 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
              >
                <FileJson className="w-4 h-4 text-amber-300" />
                Download JSON Manifest (.json)
              </button>
            </div>
          </div>

          {/* Table of Converted Files */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Converted XML Files ({convertedFiles.length})
              </h4>
              <span className="text-[11px] text-slate-500">Click individual download or use bulk ZIP above</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {convertedFiles.map((item) => (
                <div key={item.id} className="p-3.5 px-5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-600" />
                      <span>{item.xmlFileName}</span>
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
                <span className="font-semibold text-slate-200">testlink_files_manifest.json</span>
                <span className="text-[10px] text-slate-500">({convertedFiles.length} file entries)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
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
