import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Active automation script state
let activeLoginProcess = null;
let scriptLogs = [];
let scriptStatus = 'idle'; // 'idle' | 'running' | 'completed' | 'failed'
let lastExitCode = null;

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

/**
 * Custom Vite plugin to trigger & track "Run baby run" ("npm run login") automation
 */
function runLoginScriptPlugin() {
  const runHandler = (req, res) => {
    if (req.method === 'POST') {
      if (activeLoginProcess) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: false,
          alreadyRunning: true,
          message: 'Automation is already running!',
          status: scriptStatus
        }));
        return;
      }

      scriptLogs = [`[${new Date().toLocaleTimeString()}] 🚀 Launching "npm run login"...`];
      scriptStatus = 'running';
      lastExitCode = null;

      try {
        console.log(`\n============================================================`);
        console.log(`🚀 [Run baby run] Spawning "npm run login" automation...`);
        console.log(`============================================================\n`);

        activeLoginProcess = spawn('npm', ['run', 'login'], {
          cwd: path.resolve(__dirname),
          shell: true,
          env: { ...process.env, FORCE_COLOR: '1' }
        });

        activeLoginProcess.stdout.on('data', data => {
          const text = data.toString();
          process.stdout.write(text);
          scriptLogs.push(text);
          if (scriptLogs.length > 500) scriptLogs.shift();
        });

        activeLoginProcess.stderr.on('data', data => {
          const text = data.toString();
          process.stderr.write(text);
          scriptLogs.push(text);
          if (scriptLogs.length > 500) scriptLogs.shift();
        });

        activeLoginProcess.on('close', code => {
          console.log(`[Run baby run] Automation exited with code ${code}`);
          lastExitCode = code;
          scriptStatus = code === 0 ? 'completed' : 'failed';
          scriptLogs.push(`\n[${new Date().toLocaleTimeString()}] Automation finished (Exit Code: ${code})\n`);
          activeLoginProcess = null;
        });

        activeLoginProcess.on('error', err => {
          console.error(`[Run baby run Error]`, err);
          scriptStatus = 'failed';
          scriptLogs.push(`\n[${new Date().toLocaleTimeString()}] Error: ${err.message}\n`);
          activeLoginProcess = null;
        });

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: true,
          message: 'Automation script started successfully!'
        }));
      } catch (err) {
        scriptStatus = 'failed';
        activeLoginProcess = null;
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  };

  const statusHandler = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      isRunning: activeLoginProcess !== null,
      status: scriptStatus,
      exitCode: lastExitCode,
      logs: scriptLogs.join('')
    }));
  };

  const stopHandler = (req, res) => {
    if (activeLoginProcess) {
      const pid = activeLoginProcess.pid;
      console.log(`\n============================================================`);
      console.log(`🛑 [Run baby run] Terminating automation process tree (PID: ${pid})...`);
      console.log(`============================================================\n`);

      try {
        if (process.platform === 'win32') {
          // On Windows, taskkill /pid <PID> /T /F terminates the entire process tree (cmd.exe -> npm -> node -> chromium)
          exec(`taskkill /pid ${pid} /T /F`, (err) => {
            if (err) {
              console.log(`[Taskkill note] Process ${pid} may have already finished.`);
            } else {
              console.log(`[Taskkill] Successfully killed process tree ${pid}`);
            }
          });
        } else {
          try {
            process.kill(-pid, 'SIGKILL');
          } catch (_) {
            activeLoginProcess.kill('SIGKILL');
          }
        }
      } catch (err) {
        console.error(`[Stop Error] Failed to kill process ${pid}:`, err);
      }

      activeLoginProcess = null;
      scriptStatus = 'failed';
      scriptLogs.push(`\n[${new Date().toLocaleTimeString()}] 🛑 Automation stopped and terminal terminated by user.\n`);
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, message: 'Automation process stopped.' }));
  };

  return {
    name: 'run-login-script-plugin',
    configureServer(server) {
      server.middlewares.use('/api/run-login', runHandler);
      server.middlewares.use('/api/login-status', statusHandler);
      server.middlewares.use('/api/stop-login', stopHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/run-login', runHandler);
      server.middlewares.use('/api/login-status', statusHandler);
      server.middlewares.use('/api/stop-login', stopHandler);
    }
  };
}

export default defineConfig({
  plugins: [react(), saveTestJsonPlugin(), runLoginScriptPlugin()],
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
