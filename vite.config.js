import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom Vite plugin to handle saving JSON manifest directly to playwright/tests/test.json
 */
function saveTestJsonPlugin() {
  const handler = (req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const targetPath = path.resolve(__dirname, 'playwright/tests/test.json');
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          // Overwrite test.json with new JSON data
          fs.writeFileSync(targetPath, body, 'utf8');
          console.log(`[Vite API] Successfully updated: ${targetPath}`);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, path: targetPath }));
        } catch (err) {
          console.error('[Vite API Error]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  };

  return {
    name: 'save-test-json-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-manifest', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/save-manifest', handler);
    }
  };
}

export default defineConfig({
  plugins: [react(), saveTestJsonPlugin()],
  server: {
    port: 5173,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          xlsx: ['xlsx'],
          papaparse: ['papaparse']
        }
      }
    }
  }
});
