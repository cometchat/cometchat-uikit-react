import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { CoverageReportOptions } from 'monocart-coverage-reports';

const KIT_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/**
 * Whether a UI Kit source file counts towards E2E coverage: the same set as unit coverage
 * (vitest.config.ts) — src/, minus tests, stories, barrels, lazy re-exports, type-only files and
 * data tables, minus the vendored wavesurfer port.
 */
function isCounted(sourcePath: string): boolean {
  const path = sourcePath.replace(/\\/g, '/');
  if (!/(^|\/)src\//.test(path) || path.includes('sample-app/') || path.includes('node_modules/')) return false;
  // The sample app's own files also map to `src/...`; only the kit's exist under its src/.
  const fromSrc = path.slice(path.lastIndexOf('src/'));
  if (!existsSync(`${KIT_ROOT}${fromSrc}`)) return false;
  if (/(^|\/)__tests__\//.test(path) || /\.(spec|test|stories|e2e)\.tsx?$/.test(path)) return false;
  if (/(^|\/)src\/testing\//.test(path) || /\.d\.ts$/.test(path)) return false;
  if (/(^|\/)index\.ts$/.test(path) || /\.lazy\.ts$/.test(path)) return false;
  if (/\.types\.ts$/.test(path) && !path.endsWith('CometChatAIAssistantChat/ai.types.ts')) return false;
  if (path.endsWith('constants/Enums.ts') || path.endsWith('CometChatEmojiData.ts')) return false;
  if (path.includes('/wavesurfer/')) return false;
  return /\.tsx?$/.test(path);
}

/**
 * Where E2E coverage goes and what counts. Shared by the per-test collection (./test.ts) and the
 * report built in the global teardown, so both agree on the denominator.
 */
export const coverageOptions: CoverageReportOptions = {
  name: 'UI Kit E2E coverage',
  outputDir: './coverage/e2e',
  // Only the app's own bundles, not the CometChat SDK's network scripts or browser internals.
  entryFilter: entry => /\/assets\/.+\.js(\?|$)/.test(entry.url),
  sourceFilter: isCounted,
  // Count the files no test loaded too (at 0%), so the denominator matches unit coverage.
  all: { dir: ['../src'], filter: isCounted },
  // `raw` is kept so the smoke and full runs can be merged into one report.
  reports: [['console-summary'], ['json-summary'], ['lcovonly'], ['v8'], ['raw', { outputDir: 'raw' }]],
};
