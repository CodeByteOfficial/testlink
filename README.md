# CSV to XML Converter

A clean, modern, and responsive web application built with **React**, **Tailwind CSS**, and **PapaParse** that converts all records of an uploaded CSV file into a **single consolidated XML file** directly within the browser.

---

## 🌟 Key Features

1. **All CSV Records in a Single XML File**:
   - Every row from the CSV file is structured as a child record (e.g. `<record>`) inside a single root XML container (e.g. `<records>`).
   - The generated XML file is named after the uploaded CSV file (e.g., `agents_sample.xml`).

2. **Accurate XML Structure & Encoding**:
   - Standard XML declaration: `<?xml version="1.0" encoding="UTF-8"?>`.
   - Root `<records>` tag enclosing `<record>` elements for each CSV row.
   - Spaces in column headers are converted to underscores (e.g., `Agent Name` $\rightarrow$ `<Agent_Name>`).
   - XML character escaping for `&`, `<`, `>`, `"`, and `'`.
   - Preserves leading zeros (e.g. mobile numbers like `09876543210`, employee IDs like `00124`) and Unicode characters.
   - Optional customization of root element name and record element name.

3. **Client-Side Privacy & High Performance**:
   - 100% in-browser processing via HTML5 File API and Web Blobs.
   - Zero server uploads or database storage: your data stays completely private on your device.
   - Handles bulk CSV datasets smoothly with chunked processing.

4. **Interactive Dashboard**:
   - **CSV Drag-and-Drop / Browse**: Accepts only `.csv` files, displays filename, file size, and remove/replace controls.
   - **CSV Preview**: Live metrics (Total records, Total columns, Validation status), first 5 records preview table, and column-to-XML tag mapping viewer.
   - **Single XML File Download & Preview**:
     - Instant 1-click **Download XML File** button.
     - Full XML code preview modal with line numbers, copy-to-clipboard, and download option.
     - Searchable records breakdown table with pagination.
     - **Clear All**: Resets the converter state.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Run Tests
```bash
node scripts/test-converter.js
```
