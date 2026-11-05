import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { mapHeadersToXmlTags } from './xmlGenerator';

export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.tsv', '.tab', '.json', '.txt'];
export const ACCEPT_FILE_TYPES = '.csv, .xlsx, .xls, .tsv, .tab, .json, .txt, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/json, text/plain';

/**
 * Determine the file format from filename extension
 * @param {string} filename 
 * @returns {'csv'|'xlsx'|'xls'|'tsv'|'json'|'unknown'}
 */
export function getFileFormat(filename = '') {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (ext === '.xlsx') return 'xlsx';
  if (ext === '.xls') return 'xls';
  if (ext === '.tsv' || ext === '.tab') return 'tsv';
  if (ext === '.json') return 'json';
  if (ext === '.csv' || ext === '.txt') return 'csv';
  return 'unknown';
}

/**
 * Universal File Parser supporting CSV, XLSX, XLS, TSV, JSON, and TXT
 * 
 * @param {File} file 
 * @param {string|null} sheetName Optional specific sheet name for Excel files
 * @returns {Promise<{
 *   data: Object[],
 *   headers: string[],
 *   headerMappings: { original: string, sanitized: string }[],
 *   totalRecords: number,
 *   totalColumns: number,
 *   previewRows: Object[],
 *   warnings: string[],
 *   errors: string[],
 *   fileFormat: string,
 *   sheetNames: string[],
 *   selectedSheet: string|null,
 *   workbook: any|null
 * }>}
 */
export async function parseUniversalFile(file, sheetName = null) {
  if (!file) {
    throw new Error('No file provided.');
  }

  if (file.size === 0) {
    throw new Error('Uploaded file is completely empty (0 bytes). Please upload a valid file.');
  }

  const format = getFileFormat(file.name);

  if (format === 'xlsx' || format === 'xls') {
    return parseExcelFile(file, sheetName, format);
  } else if (format === 'json') {
    return parseJsonFile(file);
  } else {
    // csv, tsv, txt
    return parseDelimitedFile(file, format);
  }
}

/**
 * Parse Excel .xlsx and .xls files
 */
async function parseExcelFile(file, targetSheetName = null, format = 'xlsx') {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    raw: true,
    cellDates: true,
    cellNF: false,
    cellText: false
  });

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('The Excel workbook contains no readable worksheets.');
  }

  const selectedSheet = targetSheetName && sheetNames.includes(targetSheetName)
    ? targetSheetName
    : sheetNames[0];

  const worksheet = workbook.Sheets[selectedSheet];
  if (!worksheet) {
    throw new Error(`Sheet "${selectedSheet}" could not be read.`);
  }

  // Read as array of arrays (header: 1)
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: ''
  });

  if (!rows || rows.length === 0) {
    throw new Error(`Sheet "${selectedSheet}" is completely blank.`);
  }

  // Row 0 is headers
  const rawHeaders = (rows[0] || []).map((h, i) => (h !== undefined && h !== null ? String(h).trim() : `Column_${i + 1}`));
  const validHeaders = rawHeaders.filter(h => h && h.length > 0);

  if (validHeaders.length === 0) {
    throw new Error('No valid column headers found in row 1 of the sheet.');
  }

  const warnings = [];
  if (sheetNames.length > 1) {
    warnings.push(`Workbook contains ${sheetNames.length} sheets. Currently displaying sheet "${selectedSheet}".`);
  }

  // Check duplicate headers
  const headerCount = {};
  rawHeaders.forEach(h => {
    headerCount[h] = (headerCount[h] || 0) + 1;
  });
  const duplicateHeaders = Object.keys(headerCount).filter(h => headerCount[h] > 1);
  if (duplicateHeaders.length > 0) {
    warnings.push(`Duplicate column headers detected: [${duplicateHeaders.join(', ')}]. Suffixes will be appended.`);
  }

  // Build row objects
  const validRows = [];
  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || !Array.isArray(rawRow)) continue;

    const rowObj = {};
    let hasValue = false;

    rawHeaders.forEach((h, colIdx) => {
      let val = rawRow[colIdx];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        hasValue = true;
        rowObj[h] = String(val);
      } else {
        rowObj[h] = '';
      }
    });

    if (hasValue) {
      validRows.push(rowObj);
    }
  }

  if (validRows.length === 0) {
    throw new Error(`Sheet "${selectedSheet}" contains headers but has no data rows.`);
  }

  const headerMappings = mapHeadersToXmlTags(rawHeaders);

  return {
    data: validRows,
    headers: rawHeaders,
    headerMappings,
    totalRecords: validRows.length,
    totalColumns: rawHeaders.length,
    previewRows: validRows.slice(0, 5),
    warnings,
    errors: [],
    fileFormat: format,
    sheetNames,
    selectedSheet,
    workbook
  };
}

/**
 * Parse Delimited Text Files (.csv, .tsv, .txt)
 */
function parseDelimitedFile(file, format = 'csv') {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Critical to preserve leading zeros
      transformHeader: (h) => h.trim(),
      delimiter: "", // Auto-detect delimiter (, \t ; |)
      complete: (results) => {
        const warnings = [];

        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(err => {
            if (err.type === 'FieldMismatch') {
              warnings.push(`Row ${err.row + 1}: Column count mismatch (${err.message}).`);
            } else {
              warnings.push(`Row ${err.row ? err.row + 1 : 'Header'}: ${err.message}`);
            }
          });
        }

        const rawHeaders = results.meta && results.meta.fields ? results.meta.fields : [];
        const validHeaders = rawHeaders.filter(h => h && h.trim().length > 0);

        if (rawHeaders.length === 0 || validHeaders.length === 0) {
          return reject(new Error('File has no column headers or headers are completely blank.'));
        }

        // Filter out blank rows
        const validRows = (results.data || []).filter(row => {
          if (!row || typeof row !== 'object') return false;
          return Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '');
        });

        if (validRows.length === 0) {
          return reject(new Error('File contains headers but no valid data rows to convert.'));
        }

        // Duplicate header check
        const headerCount = {};
        rawHeaders.forEach(h => {
          headerCount[h] = (headerCount[h] || 0) + 1;
        });
        const duplicateHeaders = Object.keys(headerCount).filter(h => headerCount[h] > 1);
        if (duplicateHeaders.length > 0) {
          warnings.push(`Duplicate column headers detected: [${duplicateHeaders.join(', ')}]. Disambiguating tags.`);
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
          errors: [],
          fileFormat: format,
          sheetNames: [],
          selectedSheet: null,
          workbook: null
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse file: ${error.message}`));
      }
    });
  });
}

/**
 * Parse JSON files
 */
async function parseJsonFile(file) {
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Malformed JSON file: ${err.message}`);
  }

  let items = [];
  if (Array.isArray(json)) {
    items = json;
  } else if (typeof json === 'object' && json !== null) {
    // Check if there is an array property inside the object (e.g., data, records, items, rows)
    const arrayKey = Object.keys(json).find(k => Array.isArray(json[k]));
    if (arrayKey) {
      items = json[arrayKey];
    } else {
      // Single object wrapped as one record
      items = [json];
    }
  }

  if (!items || items.length === 0) {
    throw new Error('JSON file contains no record objects.');
  }

  // Extract all unique keys from objects as headers
  const headerSet = new Set();
  items.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(k => headerSet.add(k));
    }
  });

  const headers = Array.from(headerSet);
  if (headers.length === 0) {
    throw new Error('No valid field keys found in JSON records.');
  }

  // Normalize row objects to string values
  const validRows = items.map(item => {
    const rowObj = {};
    headers.forEach(h => {
      const val = item ? item[h] : '';
      if (val !== undefined && val !== null) {
        rowObj[h] = typeof val === 'object' ? JSON.stringify(val) : String(val);
      } else {
        rowObj[h] = '';
      }
    });
    return rowObj;
  });

  const headerMappings = mapHeadersToXmlTags(headers);

  return {
    data: validRows,
    headers,
    headerMappings,
    totalRecords: validRows.length,
    totalColumns: headers.length,
    previewRows: validRows.slice(0, 5),
    warnings: [],
    errors: [],
    fileFormat: 'json',
    sheetNames: [],
    selectedSheet: null,
    workbook: null
  };
}

/**
 * Sample dataset generator
 */
export function getSampleCsvContent() {
  return `Agent Name,Agent Email,Agent Mobile,Agent Code,Status,Notes
Test Agent One,test1@example.com,09876543210,00124,Active,Special characters: & < > ' "
Test Agent Two,test2@example.com,09876543211,00125,Pending,Preserve leading zeros in phone & code
Test Agent Three,test3@example.com,09876543212,00126,Active,Unicode text: München Café & 日本
Test Agent Four,test4@example.com,09876543213,00127,Inactive,Empty notes test
Test Agent Five,test5@example.com,09876543214,00128,Active,Multi-word column header demonstration`;
}

