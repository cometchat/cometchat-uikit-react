import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { reportE2EConfig } from './config';
import { seedTestData, ensureAgenticGroups } from './helpers/seed';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './helpers/coverage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.e2e') });

export default async function globalSetup(): Promise<void> {
  reportE2EConfig();
  // Start each coverage run from an empty cache (E2E_COVERAGE=1, see helpers/test.ts).
  if (process.env.E2E_COVERAGE === '1') MCR(coverageOptions).cleanCache();
  console.log('\n[global-setup] Verifying E2E test data...');
  await seedTestData();
  await ensureAgenticGroups();
  console.log('[global-setup] Ready.\n');
}
