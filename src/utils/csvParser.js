import Papa from 'papaparse';
import { mapHeadersToXmlTags } from './xmlGenerator';

/**
 * Validates and parses a CSV File object
 * 
 * @param {File} file 
 * @returns {Promise<{
 *   data: Object[],
 *   headers: string[],
 *   headerMappings: { original: string, sanitized: string }[],
 *   totalRecords: number,
 *   totalColumns: number,
 *   previewRows: Object[],
 *   warnings: string[],
 *   errors: string[]
 * }>}
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    if (file.size === 0) {
      return reject(new Error('Uploaded file is completely empty (0 bytes). Please upload a valid CSV file.'));
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // CRITICAL: preserve leading zeros and formatting
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const warnings = [];
        const errors = [];

        // Check parse errors
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(err => {
            if (err.type === 'FieldMismatch') {
              warnings.push(`Row ${err.row + 1}: Column count mismatch (${err.message}).`);
            } else {
              warnings.push(`Row ${err.row ? err.row + 1 : 'Header'}: ${err.message}`);
            }
          });
        }

        // Validate headers
        const rawHeaders = results.meta && results.meta.fields ? results.meta.fields : [];
        const validHeaders = rawHeaders.filter(h => h && h.trim().length > 0);

        if (rawHeaders.length === 0 || validHeaders.length === 0) {
          return reject(new Error('CSV file has no column headers or headers are completely blank.'));
        }

        // Filter out records that are completely blank
        const validRows = (results.data || []).filter(row => {
          if (!row || typeof row !== 'object') return false;
          // Check if at least one cell has content
          return Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '');
        });

        if (validRows.length === 0) {
          return reject(new Error('CSV file contains headers but no valid data rows to convert.'));
        }

        // Check for duplicate headers
        const headerCount = {};
        rawHeaders.forEach(h => {
          headerCount[h] = (headerCount[h] || 0) + 1;
        });
        const duplicateHeaders = Object.keys(headerCount).filter(h => headerCount[h] > 1);
        if (duplicateHeaders.length > 0) {
          warnings.push(`Duplicate column headers detected: [${duplicateHeaders.join(', ')}]. Disambiguating tags with suffixes (_2, _3).`);
        }

        const headerMappings = mapHeadersToXmlTags(rawHeaders);

        resolve({
          data: validRows,
          headers: rawHeaders,
          headerMappings,
          totalRecords: validRows.length,
          totalColumns: rawHeaders.length,
          previewRows: validRows.slice(0, 5),
          warnings,
          errors
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Generate a sample CSV string for quick testing
 */
export function getSampleCsvContent() {
  return `Agent Name,Agent Email,Agent Mobile,Agent Code,Status,Notes
Test Agent One,test1@example.com,09876543210,00124,Active,Special characters: & < > ' "
Test Agent Two,test2@example.com,09876543211,00125,Pending,Preserve leading zeros in phone & code
Test Agent Three,test3@example.com,09876543212,00126,Active,Unicode text: München Café & 日本
Test Agent Four,test4@example.com,09876543213,00127,Inactive,Empty notes test
Test Agent Five,test5@example.com,09876543214,00128,Active,Multi-word column header demonstration`;
}

