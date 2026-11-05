import React, { useState } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import CsvPreviewSection from './components/CsvPreviewSection';
import ConversionProgress from './components/ConversionProgress';
import ResultsSection from './components/ResultsSection';
import TestLinkTransferModal from './components/TestLinkTransferModal';
import { parseUniversalFile, getSampleCsvContent } from './utils/fileParser';
import { generateCombinedXml } from './utils/xmlGenerator';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [fileFormat, setFileFormat] = useState('csv');
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);

  // XML tag naming configuration
  const [rootTag, setRootTag] = useState('records');
  const [recordTag, setRecordTag] = useState('record');

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
        // Generate single combined XML containing all rows
        const singleXml = generateCombinedXml(rows, headerMappings, rootTag || 'records', recordTag || 'record');
        setCombinedXml(singleXml);
        setGeneratedRecords(recordSummaries);
        setIsConverting(false);
        setIsConverted(true);
      }
    }

    setTimeout(processBatch, 20);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Header */}
      <Header
        onLoadSample={handleLoadSample}
        hasUploadedFile={!!file}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
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
          <div className="border border-slate-200/80 bg-white/60 rounded-2xl p-6 sm:p-8 backdrop-blur-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              All Records in One File &amp; TestLink Transfer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 text-sm">1. Multi-Format to One XML</div>
                <p>
                  Upload <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">.csv</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">.xlsx / .xls</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">.tsv</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">.json</code> to bundle all records into a single <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">.xml</code> file.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 text-sm">2. Instant Download &amp; Copy</div>
                <p>
                  Download the unified XML file or copy its raw content directly to clipboard with one click.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 text-sm">3. Transfer to TestLink</div>
                <p>
                  Use the <strong>Transfer to TestLink</strong> button to automatically launch <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">testing.creditq.co.in</code>, navigate to Test Specification, and access the Settings Actions cog after a 3-second delay.
                </p>
              </div>
            </div>
          </div>
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
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Universal File to XML Converter</span>
            <span>&bull; Direct TestLink Integration</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Private: Client-side processing only (no server upload)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
