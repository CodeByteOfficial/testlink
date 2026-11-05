// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  /* Timeout set to 120s to easily accommodate multiple 8-second steps */
  timeout: 120 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false,
    /* HTTP Basic Auth popup credentials (from your screenshot) */
    httpCredentials: {
      username: process.env.BASIC_AUTH_USER || 'cqtesting',
      password: process.env.BASIC_AUTH_PASS || 'CqTest@2025', // <-- 🔴 PASTE YOUR HTTP BASIC AUTH PASSWORD HERE
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
