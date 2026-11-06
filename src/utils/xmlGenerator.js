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
 * Safely format a value as XML CDATA: <![CDATA[value]]>
 * @param {any} value
 * @returns {string}
 */
export function wrapCdata(value) {
  if (value === null || value === undefined) {
    return '<![CDATA[]]>';
  }
  const str = String(value).replace(/^\uFEFF/, '').trim();
  if (!str) {
    return '<![CDATA[]]>';
  }
  // Safely escape CDATA end sequence ]]> if present in user content
  const safeStr = str.replace(/\]\]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${safeStr}]]>`;
}

/**
 * Map importance string or number to TestLink numeric code:
 * 3 = High, 2 = Medium, 1 = Low
 * @param {any} value
 * @returns {string}
 */
export function mapImportanceToTestLink(value) {
  if (value === null || value === undefined || value === '') {
    return '3';
  }
  const str = String(value).toLowerCase().trim();
  if (str === '1' || str === 'low' || str === 'l') return '1';
  if (str === '2' || str === 'medium' || str === 'med' || str === 'm' || str === 'normal') return '2';
  if (str === '3' || str === 'high' || str === 'h' || str === 'critical' || str === 'urgent') return '3';
  return '3';
}

/**
 * Map execution type to TestLink numeric code:
 * 1 = Manual, 2 = Automated
 * @param {any} value
 * @returns {string}
 */
export function mapExecutionTypeToTestLink(value) {
  if (value === null || value === undefined || value === '') {
    return '1';
  }
  const str = String(value).toLowerCase().trim();
  if (str === '2' || str === 'automated' || str === 'auto') return '2';
  return '1';
}

/**
 * Find field value from a row using aliases
 */
function findRowField(row, aliases) {
  if (!row || typeof row !== 'object') return '';
  const keys = Object.keys(row);

  // 1. Direct match
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') {
      return String(row[alias]).trim();
    }
  }

  // 2. Normalized match (lowercase, stripped symbols)
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[\s_\-()]+/g, '');
    for (const key of keys) {
      const cleanKey = key.toLowerCase().replace(/[\s_\-()]+/g, '');
      if (cleanKey === cleanAlias && row[key] !== undefined && row[key] !== null) {
        const val = String(row[key]).trim();
        if (val) return val;
      }
    }
  }

  return '';
}

/**
 * Generate TestLink-compliant XML adhering strictly to the <testcases> schema:
 * 
 * <?xml version="1.0" encoding="UTF-8"?>
 * <testcases>
 *   <testcase internalid="" name="TC-01">
 *     <node_order><![CDATA[]]></node_order>
 *     <externalid><![CDATA[]]></externalid>
 *     <version><![CDATA[]]></version>
 *     <summary><![CDATA[...]]></summary>
 *     <preconditions><![CDATA[...]]></preconditions>
 *     <execution_type><![CDATA[1]]></execution_type>
 *     <importance><![CDATA[3]]></importance>
 *     <steps>
 *       <step>
 *         <step_number><![CDATA[1]]></step_number>
 *         <actions><![CDATA[...]]></actions>
 *         <expectedresults><![CDATA[...]]></expectedresults>
 *         <execution_type><![CDATA[1]]></execution_type>
 *       </step>
 *     </steps>
 *   </testcase>
 * </testcases>
 * 
 * @param {Array<Object>} rows All rows from CSV, Excel, TSV, JSON, etc.
 * @returns {string} XML string
 */
export function generateTestLinkXml(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<testcases>\n</testcases>';
  }

  const NAME_ALIASES = [
    'name', 'testcasename', 'test case name', 'tc_name', 'tc name',
    'test case id', 'testcase id', 'tc_id', 'tc id', 'tcid', 'id',
    'test_case', 'testcase', 'test id', 'test_id'
  ];

  const SUMMARY_ALIASES = [
    'summary', 'test summary', 'testcase summary', 'title', 'test title',
    'description', 'test description', 'objective', 'scenario', 'test scenario'
  ];

  const PRECONDITIONS_ALIASES = [
    'preconditions', 'precondition', 'pre condition', 'pre-condition',
    'pre-conditions', 'prerequisites', 'prerequisite'
  ];

  const ACTIONS_ALIASES = [
    'actions', 'action', 'step actions', 'step action', 'test steps',
    'test step', 'steps', 'step', 'procedure', 'test procedure'
  ];

  const EXPECTED_RESULTS_ALIASES = [
    'expected results', 'expected result', 'expected_result', 'expected_results',
    'expectedresults', 'expected output', 'expected', 'acceptance criteria'
  ];

  const IMPORTANCE_ALIASES = ['importance', 'priority', 'severity'];
  const EXECUTION_TYPE_ALIASES = ['execution_type', 'executiontype', 'execution type', 'type'];
  const STEP_NUMBER_ALIASES = ['step_number', 'step number', 'step_no', 'step no', 'step'];
  const NODE_ORDER_ALIASES = ['node_order', 'node order', 'order'];
  const EXTERNAL_ID_ALIASES = ['externalid', 'external id', 'external_id'];
  const VERSION_ALIASES = ['version', 'ver'];

  const testcases = [];
  let currentCase = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;

    const rawName = findRowField(row, NAME_ALIASES);
    const summary = findRowField(row, SUMMARY_ALIASES);
    const preconditions = findRowField(row, PRECONDITIONS_ALIASES);
    const actions = findRowField(row, ACTIONS_ALIASES);
    const expectedresults = findRowField(row, EXPECTED_RESULTS_ALIASES);
    const importance = mapImportanceToTestLink(findRowField(row, IMPORTANCE_ALIASES));
    const executionType = mapExecutionTypeToTestLink(findRowField(row, EXECUTION_TYPE_ALIASES));
    const stepNumber = findRowField(row, STEP_NUMBER_ALIASES);
    const nodeOrder = findRowField(row, NODE_ORDER_ALIASES);
    const externalid = findRowField(row, EXTERNAL_ID_ALIASES);
    const version = findRowField(row, VERSION_ALIASES);

    let finalSummary = summary;
    let finalActions = actions;
    let finalExpected = expectedresults;

    // If generic data without summary or actions, format entries into summary
    if (!finalSummary && !finalActions && !finalExpected) {
      const entries = Object.entries(row).filter(([k, v]) => v !== undefined && v !== null && String(v).trim() !== '');
      if (entries.length > 0) {
        finalSummary = entries.map(([k, v]) => `${k}: ${v}`).join(' | ');
        finalActions = `Verify ${rawName || entries[0][0]}`;
        finalExpected = `${rawName || 'Record'} processed successfully`;
      }
    }

    const testcaseName = rawName || (currentCase && !summary && (actions || expectedresults) ? currentCase.name : `TC-${String(testcases.length + 1).padStart(2, '0')}`);

    // Check if this row is an additional step for the active testcase
    const isNextStep = currentCase && (
      (rawName && rawName === currentCase.name && (!summary || summary === currentCase.summary)) ||
      (!rawName && (actions || expectedresults))
    );

    if (isNextStep && currentCase) {
      const nextStepNum = stepNumber || String(currentCase.steps.length + 1);
      currentCase.steps.push({
        step_number: nextStepNum,
        actions: finalActions,
        expectedresults: finalExpected,
        execution_type: executionType || '1'
      });
    } else {
      currentCase = {
        name: testcaseName,
        internalid: '',
        node_order: nodeOrder,
        externalid: externalid,
        version: version,
        summary: finalSummary,
        preconditions: preconditions,
        execution_type: executionType || '1',
        importance: importance || '3',
        steps: [
          {
            step_number: stepNumber || '1',
            actions: finalActions,
            expectedresults: finalExpected,
            execution_type: executionType || '1'
          }
        ]
      };
      testcases.push(currentCase);
    }
  }

  // Build XML output
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<testcases>'
  ];

  for (const tc of testcases) {
    const safeName = (tc.name || '').replace(/"/g, '&quot;');
    lines.push(`  <testcase internalid="" name="${safeName}">`);
    lines.push(`    <node_order>${wrapCdata(tc.node_order)}</node_order>`);
    lines.push(`    <externalid>${wrapCdata(tc.externalid)}</externalid>`);
    lines.push(`    <version>${wrapCdata(tc.version)}</version>`);
    lines.push(`    <summary>${wrapCdata(tc.summary)}</summary>`);
    lines.push(`    <preconditions>${wrapCdata(tc.preconditions)}</preconditions>`);
    lines.push(`    <execution_type>${wrapCdata(tc.execution_type)}</execution_type>`);
    lines.push(`    <importance>${wrapCdata(tc.importance)}</importance>`);
    lines.push('    <steps>');

    for (const st of tc.steps) {
      lines.push('      <step>');
      lines.push(`        <step_number>${wrapCdata(st.step_number)}</step_number>`);
      lines.push(`        <actions>${wrapCdata(st.actions)}</actions>`);
      lines.push(`        <expectedresults>${wrapCdata(st.expectedresults)}</expectedresults>`);
      lines.push(`        <execution_type>${wrapCdata(st.execution_type)}</execution_type>`);
      lines.push('      </step>');
    }

    lines.push('    </steps>');
    lines.push('  </testcase>');
  }

  lines.push('</testcases>');
  return lines.join('\n');
}

/**
 * Generate a SINGLE consolidated XML string containing ALL rows of the file
 * Defaults to the TestLink-compliant <testcases> schema unless explicitly requested otherwise.
 * 
 * @param {Array<Object>} rows All rows from the file
 * @param {{ original: string, sanitized: string }[]} headerMappings
 * @param {string} rootTag Outer root element name (default: 'testcases')
 * @param {string} recordTag Item element name (default: 'testcase')
 * @returns {string} Complete XML document string
 */
export function generateCombinedXml(rows, headerMappings, rootTag = 'testcases', recordTag = 'testcase') {
  // Always use the TestLink <testcases> format if default or testcase tags are specified
  if (!rootTag || rootTag === 'testcases') {
    return generateTestLinkXml(rows);
  }

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
