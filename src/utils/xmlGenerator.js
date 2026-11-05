/**
 * Utilities for sanitizing XML element names and generating XML files
 */

/**
 * Escape special XML characters
 * @param {string|any} value 
 * @returns {string}
 */
export function escapeXml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitize a string to be a valid XML element name
 * XML Element naming rules:
 * - Names can contain letters, numbers, and other characters
 * - Names cannot start with a number or punctuation character
 * - Names cannot start with the letters xml (or XML, or Xml, etc)
 * - Names cannot contain spaces
 * 
 * @param {string} header
 * @param {number} colIndex Fallback index if header is empty
 * @returns {string}
 */
export function sanitizeTagName(header, colIndex = 0) {
  let name = (header || '').trim();

  // If completely empty, use fallback
  if (!name) {
    return `Column_${colIndex + 1}`;
  }

  // Convert spaces and common separators to underscores
  name = name.replace(/[\s\t\n\r]+/g, '_');

  // Replace invalid characters (anything not letter, digit, hyphen, underscore, period) with underscore
  name = name.replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF.-]/g, '_');

  // Reduce multiple consecutive underscores to a single underscore
  name = name.replace(/_+/g, '_');

  // XML tag cannot start with a number, period, or hyphen
  if (/^[0-9.-]/.test(name)) {
    name = `_${name}`;
  }

  // XML tag cannot start with "xml" (case-insensitive) per XML specification
  if (/^xml/i.test(name)) {
    name = `tag_${name}`;
  }

  // If all characters were stripped/invalid, provide fallback
  if (!name || name === '_') {
    return `Column_${colIndex + 1}`;
  }

  return name;
}

/**
 * Ensure unique tag names for all headers
 * Handles duplicate column headers safely by appending suffix _2, _3, etc.
 * 
 * @param {string[]} headers
 * @returns {{ original: string, sanitized: string }[]}
 */
export function mapHeadersToXmlTags(headers) {
  const seen = new Map();
  return headers.map((rawHeader, idx) => {
    let sanitized = sanitizeTagName(rawHeader, idx);
    const count = seen.get(sanitized) || 0;
    if (count > 0) {
      const uniqueName = `${sanitized}_${count + 1}`;
      seen.set(sanitized, count + 1);
      return {
        original: rawHeader || `(Column ${idx + 1})`,
        sanitized: uniqueName,
      };
    } else {
      seen.set(sanitized, 1);
      return {
        original: rawHeader || `(Column ${idx + 1})`,
        sanitized,
      };
    }
  });
}

/**
 * Generate formatted XML string for a single row of data
 * 
 * @param {Object} rowData Key-value pair where keys match original headers or sanitized headers
 * @param {{ original: string, sanitized: string }[]} headerMappings
 * @param {string} recordTag Name of individual record tag (default: 'record')
 * @returns {string} XML string
 */
export function generateRowXml(rowData, headerMappings, recordTag = 'record') {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${recordTag}>`
  ];

  for (const { original, sanitized } of headerMappings) {
    const rawVal = rowData[original] !== undefined ? rowData[original] : (rowData[sanitized] ?? '');
    const escapedVal = escapeXml(rawVal);
    lines.push(`    <${sanitized}>${escapedVal}</${sanitized}>`);
  }

  lines.push(`</${recordTag}>`);
  return lines.join('\n');
}

/**
 * Generate a SINGLE consolidated XML string containing ALL rows of the CSV
 * 
 * @param {Array<Object>} rows All rows from the CSV
 * @param {{ original: string, sanitized: string }[]} headerMappings
 * @param {string} rootTag Outer root element name (default: 'records')
 * @param {string} recordTag Item element name (default: 'record')
 * @returns {string} Complete XML document string
 */
export function generateCombinedXml(rows, headerMappings, rootTag = 'records', recordTag = 'record') {
  const sanitizedRoot = sanitizeTagName(rootTag) || 'records';
  const sanitizedItem = sanitizeTagName(recordTag) || 'record';

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${sanitizedRoot}>`
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    lines.push(`    <${sanitizedItem}>`);
    for (const { original, sanitized } of headerMappings) {
      const rawVal = row[original] !== undefined ? row[original] : (row[sanitized] ?? '');
      const escapedVal = escapeXml(rawVal);
      lines.push(`        <${sanitized}>${escapedVal}</${sanitized}>`);
    }
    lines.push(`    </${sanitizedItem}>`);
  }

  lines.push(`</${sanitizedRoot}>`);
  return lines.join('\n');
}

/**
 * Trigger immediate browser download of an XML file
 * 
 * @param {string} xmlContent 
 * @param {string} fileName 
 */
export function downloadXmlFile(xmlContent, fileName) {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
