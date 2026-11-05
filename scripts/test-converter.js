import assert from 'node:assert';
import { sanitizeTagName, mapHeadersToXmlTags, escapeXml, generateCombinedXml } from '../src/utils/xmlGenerator.js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

console.log('Running test suite for Universal File to XML Converter...\n');

// Test 1: XML Character Escaping
console.log('Test 1: XML Character Escaping');
assert.strictEqual(escapeXml('Hello & World'), 'Hello &amp; World');
assert.strictEqual(escapeXml('<tag>'), '&lt;tag&gt;');
assert.strictEqual(escapeXml('"Quotes" and \'Apostrophes\''), '&quot;Quotes&quot; and &apos;Apostrophes&apos;');
assert.strictEqual(escapeXml(null), '');
assert.strictEqual(escapeXml(undefined), '');
assert.strictEqual(escapeXml(12345), '12345');
console.log('✓ Passed XML Escaping tests');

// Test 2: Tag Name Sanitization
console.log('\nTest 2: Tag Name Sanitization');
assert.strictEqual(sanitizeTagName('Agent Name'), 'Agent_Name');
assert.strictEqual(sanitizeTagName('Agent Email'), 'Agent_Email');
assert.strictEqual(sanitizeTagName('Agent Mobile'), 'Agent_Mobile');
assert.strictEqual(sanitizeTagName('123 Numeric'), '_123_Numeric');
assert.strictEqual(sanitizeTagName('xml_field'), 'tag_xml_field');
assert.strictEqual(sanitizeTagName('User @ Phone # Number'), 'User_Phone_Number');
console.log('✓ Passed Tag Sanitization tests');

// Test 3: CSV to Single XML Conversion
console.log('\nTest 3: CSV to Single XML Conversion');
const sampleCsv = `Agent Name,Agent Email,Agent Mobile
Test Agent One,test1@example.com,09876543210
Test Agent Two,test2@example.com,09876543211`;

const parsedCsv = Papa.parse(sampleCsv, {
  header: true,
  skipEmptyLines: 'greedy',
  dynamicTyping: false
});

const csvHeaderMappings = mapHeadersToXmlTags(parsedCsv.meta.fields);
const csvXml = generateCombinedXml(parsedCsv.data, csvHeaderMappings, 'records', 'record');

assert.ok(csvXml.includes('<records>'), 'Contains root <records>');
assert.ok(csvXml.includes('<Agent_Mobile>09876543210</Agent_Mobile>'), 'Preserves leading zeros in phone');
assert.ok(csvXml.includes('<Agent_Name>Test Agent One</Agent_Name>'), 'Contains Agent Name tag');
console.log('✓ Passed CSV to Single XML test');

// Test 4: Excel XLSX to Single XML Conversion
console.log('\nTest 4: Excel XLSX to Single XML Conversion');
const wb = XLSX.utils.book_new();
const wsData = [
  ['Client Name', 'Account ID', 'Balance & Fee', 'Phone Number'],
  ['Alice Smith', 'ACC-001', '$100 <Promo>', '00987654321'],
  ['Bob Jones', 'ACC-002', '$200 "Standard"', '00987654322']
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, 'Clients');

const xlsxBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const readWb = XLSX.read(xlsxBuf, { type: 'buffer', raw: true });
const readWs = readWb.Sheets[readWb.SheetNames[0]];
const excelRows = XLSX.utils.sheet_to_json(readWs, { header: 1, raw: true, defval: '' });

const excelHeaders = excelRows[0].map(h => String(h).trim());
const excelHeaderMappings = mapHeadersToXmlTags(excelHeaders);

const excelRowObjs = [];
for (let i = 1; i < excelRows.length; i++) {
  const rowObj = {};
  excelHeaders.forEach((h, colIdx) => {
    rowObj[h] = excelRows[i][colIdx];
  });
  excelRowObjs.push(rowObj);
}

const excelXml = generateCombinedXml(excelRowObjs, excelHeaderMappings, 'clients', 'client');

assert.ok(excelXml.includes('<clients>'), 'Root tag is <clients>');
assert.ok(excelXml.includes('<client>'), 'Record tag is <client>');
assert.ok(excelXml.includes('<Phone_Number>00987654321</Phone_Number>'), 'Preserves leading zeros from XLSX');
assert.ok(excelXml.includes('<Balance_Fee>$100 &lt;Promo&gt;</Balance_Fee>'), 'Escapes XML special characters in XLSX');
console.log('✓ Passed Excel XLSX to Single XML test');

// Test 5: JSON to Single XML Conversion
console.log('\nTest 5: JSON to Single XML Conversion');
const jsonRecords = [
  { "id": "001", "name": "Item & One", "price": "19.99" },
  { "id": "002", "name": "Item <Two>", "price": "29.99" }
];
const jsonHeaders = Object.keys(jsonRecords[0]);
const jsonHeaderMappings = mapHeadersToXmlTags(jsonHeaders);
const jsonXml = generateCombinedXml(jsonRecords, jsonHeaderMappings, 'inventory', 'item');

assert.ok(jsonXml.includes('<inventory>'), 'Contains custom root tag');
assert.ok(jsonXml.includes('<item>'), 'Contains custom item tag');
assert.ok(jsonXml.includes('<id>001</id>'), 'Preserves string ID with leading zeros');
assert.ok(jsonXml.includes('<name>Item &amp; One</name>'), 'Escapes & in JSON data');
console.log('✓ Passed JSON to Single XML test');

console.log('\nAll Multi-Format Universal Tests Passed Successfully!');
