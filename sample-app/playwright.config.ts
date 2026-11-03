import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

// E2E_PORT lets a run use another port, e.g. when a dev server already holds 3005.
const BASE_URL = `http://localhost:${process.env.E2E_PORT ?? '3005'}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // e2e-results/results.json is a machine-readable summary of the run.
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['list'],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    // The app follows the browser's language, and the tests match English text: pin it, so a
    // machine set to another language runs the same tests. e2e/locale overrides it per test.
    locale: 'en-US',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
      },
    },
  ],

  // E2E_WEB_SERVER_COMMAND overrides the dev server — e.g. `npx vite preview --port
  // 3005 --strictPort` to run the suite against a production build.
  webServer: {
    command: process.env.E2E_WEB_SERVER_COMMAND ?? 'npm run dev',
    url: BASE_URL,
    // Reuse a running dev server locally; never when a specific server command is
    // requested (e.g. a production build), so a stray dev server can't stand in.
    reuseExistingServer: !process.env.E2E_WEB_SERVER_COMMAND,
    timeout: 60_000,
  },
});
