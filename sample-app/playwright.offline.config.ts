import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Offline support E2E: the sample app in the `offline-e2e` Vite mode (the kit
 * built from ../src, see vite.config.ts and .env.offline-e2e) against the
 * offline conformance harness's local fake CometChat server. No real App ID,
 * keys or network are used, and it does not need `.env.e2e`.
 *
 * Needs:
 *   - OFFLINE_CONFORMANCE_DIR: a checkout of the offline conformance harness
 *     (its `server/` is started with TLS; run `npm install` and `npm run certs`
 *     in it once). Without it, a fake server must already be listening on the
 *     ports below.
 *   - a Chat SDK with offline support (4.3.0 or later), which this app depends on.
 *     The kit's peer dependency stays ^4.2.0; with an older SDK offline is off.
 *
 * Usage:
 *   OFFLINE_CONFORMANCE_DIR=../../offline-conformance npx playwright test -c playwright.offline.config.ts
 *   (PW_CHROME_CHANNEL=chrome uses an installed Google Chrome instead of Playwright's download.)
 */
const harness = process.env['OFFLINE_CONFORMANCE_DIR']
  ? path.resolve(process.env['OFFLINE_CONFORMANCE_DIR'])
  : '';
const serverDir = harness ? path.join(harness, 'server') : '';

/** The React kit's fake-server ports (other kits use other ranges, so suites never collide). */
export const OFFLINE_SERVER = {
  dataPort: Number(process.env['OFFLINE_DATA_PORT'] ?? 51787),
  wsPort: Number(process.env['OFFLINE_WS_PORT'] ?? 51788),
  controlPort: Number(process.env['OFFLINE_CONTROL_PORT'] ?? 51789),
};

/** Not 3005, so a normal `npm run dev` on 3005 is never reused by mistake. */
const APP_PORT = Number(process.env['OFFLINE_APP_PORT'] ?? 3157);

export default defineConfig({
  testDir: './e2e/offline',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  // One fake server, one world: the tests reset it and must not overlap.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-offline' }]],
  outputDir: 'test-results-offline',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    // The SDK hard-codes https:// and wss://; the fake server uses a local CA.
    ignoreHTTPSErrors: true,
    // The fake server sends no CORS headers (the harness drives it from Node); real CometChat does.
    launchOptions: { args: ['--disable-web-security'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
        ...(process.env['PW_CHROME_CHANNEL'] ? { channel: process.env['PW_CHROME_CHANNEL'] } : {}),
      },
    },
  ],
  webServer: [
    ...(harness
      ? [
          {
            command: 'node src/index.mjs',
            cwd: serverDir,
            env: {
              PORT: String(OFFLINE_SERVER.dataPort),
              WS_PORT: String(OFFLINE_SERVER.wsPort),
              CONTROL_PORT: String(OFFLINE_SERVER.controlPort),
              TLS_CERT: path.join(serverDir, 'certs', 'leaf.pem'),
              TLS_KEY: path.join(serverDir, 'certs', 'leaf.key'),
              QUIET: '1',
            },
            url: `http://127.0.0.1:${OFFLINE_SERVER.controlPort}/requests`,
            reuseExistingServer: true,
            timeout: 30_000,
          },
        ]
      : []),
    {
      // The app's data host must match the fake server's data port (.env.offline-e2e).
      command: `npx vite --mode offline-e2e --port ${String(APP_PORT)} --strictPort`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
