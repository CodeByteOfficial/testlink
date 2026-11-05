import JSZip from 'jszip';

/**
 * Creates a ZIP file containing all generated XML files and triggers download in the browser
 * 
 * @param {Array<{ id: number, fileName: string, xmlContent: string }>} records 
 * @param {string} zipFilename 
 * @param {(progressPercent: number) => void} onProgress 
 * @returns {Promise<void>}
 */
export async function downloadAllAsZip(records, zipFilename = 'xml_records.zip', onProgress = null) {
  if (!records || records.length === 0) {
    throw new Error('No XML records available to download.');
  }

  const zip = new JSZip();

  // Add each XML file to zip root
  records.forEach((rec) => {
    zip.file(rec.fileName, rec.xmlContent);
  });

  // Generate zip file with progress callback
  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    },
    (metadata) => {
      if (onProgress && typeof onProgress === 'function') {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  // Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

