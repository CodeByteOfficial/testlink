import * as XLSX from 'xlsx';

console.log('Testing XLSX parser capabilities...');
const wb = XLSX.utils.book_new();
const wsData = [
  ['Agent Name', 'Agent Email', 'Agent Mobile', 'Agent Code'],
  ['Agent 1', 'a1@test.com', '09876543210', '00123'],
  ['Agent 2', 'a2@test.com', '09876543211', '00124']
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, 'Agents');

// Export to xlsx buffer
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const readWb = XLSX.read(buf, { type: 'buffer', raw: true });
const readWs = readWb.Sheets[readWb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(readWs, { header: 1, raw: true, defval: '' });

console.log('Sheet Names:', readWb.SheetNames);
console.log('Headers:', rows[0]);
console.log('Row 1:', rows[1]);
console.log('Mobile preserved:', rows[1][2]);

