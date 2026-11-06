import React, { useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import UploadSection from './components/UploadSection';
import BulkCsvSection from './components/BulkCsvSection';
import CsvPreviewSection from './components/CsvPreviewSection';
import ConversionProgress from './components/ConversionProgress';
import ResultsSection from './components/ResultsSection';
import TestLinkTransferModal from './components/TestLinkTransferModal';
import { parseUniversalFile, getSampleCsvContent } from './utils/fileParser';
import { generateCombinedXml, generateTestLinkXml } from './utils/xmlGenerator';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState('bulk'); // Default to bulk automation suite
  const [file, setFile] = useState(null);
  const [fileFormat, setFileFormat] = useState('csv');
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);

  // XML tag naming configuration (Default TestLink Schema)
  const [rootTag, setRootTag] = useState('testcases');
  const [recordTag, setRecordTag] = useState('testcase');

  // Conversion states
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedCount, setConvertedCount] = useState(0);

  // Single Consolidated XML Output
  const [combinedXml, setCombinedXml] = useState('');
  const [xmlFileName, setXmlFileName] = useState('');
  const [generatedRecords, setGeneratedRecords] = useState([]);

  // TestLink Modal state
  const [isTestLinkModalOpen, setIsTestLinkModalOpen] = useState(false);

  // Handle file selection (drag-and-drop or file input browse)
  const handleFileSelect = async (selectedFile, validationError, targetSheet = null) => {
    setError(null);
    setIsConverted(false);
    setProgress(0);
    setConvertedCount(0);
    setCombinedXml('');
    setGeneratedRecords([]);

    if (validationError) {
      setFile(null);
      setParsedData(null);
      setError(validationError);
      return;
    }

    if (!selectedFile) {
      setFile(null);
      setParsedData(null);
      return;
    }

    setFile(selectedFile);

    // Default output XML name based on uploaded filename
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    setXmlFileName(`${baseName}.xml`);

    try {
      const parsedResult = await parseUniversalFile(selectedFile, targetSheet);
      setParsedData(parsedResult);
      setFileFormat(parsedResult.fileFormat);
      setSheetNames(parsedResult.sheetNames || []);
      setSelectedSheet(parsedResult.selectedSheet);
    } catch (err) {
      setParsedData(null);
      setError(err.message || 'Failed to parse file.');
    }
  };

  // Switch Excel worksheet
  const handleSheetChange = (newSheetName) => {
    if (!file) return;
    handleFileSelect(file, null, newSheetName);
  };

  // Remove File action
  const handleRemoveFile = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setFileFormat('csv');
    setSheetNames([]);
    setSelectedSheet(null);
    setIsConverting(false);
    setIsConverted(false);
    setProgress(0);
    setConvertedCount(0);
    setCombinedXml('');
    setXmlFileName('');
    setGeneratedRecords([]);
  };

  // Clear All / Reset application
  const handleClearAll = () => {
    handleRemoveFile();
  };

  // Load sample CSV demonstration
  const handleLoadSample = () => {
    const sampleCsv = getSampleCsvContent();
    const sampleBlob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8' });
    const sampleFile = new File([sampleBlob], 'agents_sample.csv', { type: 'text/csv' });
    handleFileSelect(sampleFile, null);
  };

  // Convert all records into a single consolidated XML file
  const handleConvert = () => {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
      setError('No valid data available to convert.');
      return;
    }

    setIsConverting(true);
    setIsConverted(false);
    setProgress(0);
    setConvertedCount(0);
    setError(null);

    const rows = parsedData.data;
    const headerMappings = parsedData.headerMappings;
    const total = rows.length;
    const recordSummaries = [];

    const CHUNK_SIZE = 250;
    let currentIndex = 0;

    function processBatch() {
      const end = Math.min(currentIndex + CHUNK_SIZE, total);

      for (let i = currentIndex; i < end; i++) {
        const row = rows[i];
        const recordId = i + 1;
        recordSummaries.push({
          id: recordId,
          rowData: row
        });
      }

      currentIndex = end;
      const currentPercent = Math.round((currentIndex / total) * 100);
      setProgress(currentPercent);
      setConvertedCount(currentIndex);

      if (currentIndex < total) {
        setTimeout(processBatch, 0);
      } else {
        // Generate TestLink compliant XML (<testcases>)
        const singleXml = (rootTag === 'testcases' || !rootTag || rootTag === 'records')
          ? generateTestLinkXml(rows)
          : generateCombinedXml(rows, headerMappings, rootTag, recordTag);
        setCombinedXml(singleXml);
        setGeneratedRecords(recordSummaries);
        setIsConverting(false);
        setIsConverted(true);
      }
    }

    setTimeout(processBatch, 20);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-blue-600/30 selection:text-cyan-200">
      {/* Header with Dark Glass Navbar */}
      <Header
        onLoadSample={handleLoadSample}
        hasUploadedFile={!!file}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      />

      {/* 🌟 Futuristic Hero Section & 3 Feature Cards (Matching Screenshot) */}
      <HeroSection 
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        onScrollToWorkspace={() => {
          document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Workspace Container */}
      <main id="workspace" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative">
        
        {/* Ambient Radial Spotlight */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        {activeMode === 'bulk' ? (
          /* Bulk CSV Converter & Runner View */
          <BulkCsvSection onBackToSingle={() => setActiveMode('single')} />
        ) : (
          /* Single File Converter View */
          <>
            {/* Upload Section */}
            <UploadSection
              file={file}
              fileFormat={fileFormat}
              sheetNames={sheetNames}
              selectedSheet={selectedSheet}
              onSheetChange={handleSheetChange}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              onConvert={handleConvert}
              isConverting={isConverting}
              isConverted={isConverted}
              totalRecords={parsedData ? parsedData.totalRecords : null}
              rootTag={rootTag}
              setRootTag={setRootTag}
              recordTag={recordTag}
              setRecordTag={setRecordTag}
              error={error}
              onSwitchToBulk={() => setActiveMode('bulk')}
            />

            {/* Data Preview Section */}
            {parsedData && (
              <CsvPreviewSection
                parsedData={parsedData}
                totalRecords={parsedData.totalRecords}
                totalColumns={parsedData.totalColumns}
                headers={parsedData.headers}
                headerMappings={parsedData.headerMappings}
                previewRows={parsedData.previewRows}
                warnings={parsedData.warnings}
                fileFormat={fileFormat}
              />
            )}

            {/* Conversion Progress Section */}
            <ConversionProgress
              isConverting={isConverting}
              progress={progress}
              currentCount={convertedCount}
              totalRecords={parsedData ? parsedData.totalRecords : 0}
              isConverted={isConverted}
              xmlFileName={xmlFileName}
            />

            {/* Single Consolidated XML Results Section with Transfer to TestLink */}
            {isConverted && (
              <ResultsSection
                combinedXml={combinedXml}
                xmlFileName={xmlFileName}
                totalRecords={parsedData ? parsedData.totalRecords : 0}
                records={generatedRecords}
                headers={parsedData ? parsedData.headers : []}
                onClearAll={handleClearAll}
                onOpenTestLink={() => setIsTestLinkModalOpen(true)}
              />
            )}

            {/* Feature Explanatory Card if no file uploaded */}
            {!file && (
              <div className="border border-blue-500/20 bg-slate-900/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  All Records in One File &amp; TestLink Autonomous Transfer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
                  <div className="space-y-1.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-white text-sm">1. Multi-Format to One XML</div>
                    <p className="text-slate-400 leading-relaxed">
                      Upload <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 border border-blue-500/30">.csv</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 border border-emerald-500/30">.xlsx / .xls</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 border border-amber-500/30">.tsv</code>, or <code className="bg-slate-900 px-1 py-0.5 rounded text-purple-300 border border-purple-500/30">.json</code> to bundle all records into a single <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 border border-blue-500/30">.xml</code> file.
                    </p>
                  </div>
                  <div className="space-y-1.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-white text-sm">2. Bulk Batch Conversion</div>
                    <p className="text-slate-400 leading-relaxed">
                      Use the <strong>Bulk Upload</strong> mode to drop multiple files at once, convert each file to XML individually with "I am the artist bro!", and export a JSON manifest of file paths.
                    </p>
                  </div>
                  <div className="space-y-1.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-white text-sm">3. Playwright Runner</div>
                    <p className="text-slate-400 leading-relaxed">
                      Launch the <strong>"Run baby run"</strong> autonomous automation engine to execute all test suites dynamically across TestLink with full frame traversal and live terminal logs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* TestLink Transfer Automation Modal */}
      <TestLinkTransferModal
        isOpen={isTestLinkModalOpen}
        onClose={() => setIsTestLinkModalOpen(false)}
        xmlFileName={xmlFileName}
        combinedXml={combinedXml}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">welcome to the automation world</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">Direct TestLink &amp; Playwright Suite</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% In-Browser Privacy: Client-side processing only (no server upload)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
