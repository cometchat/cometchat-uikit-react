import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupTestData } from './helpers/seed';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './helpers/coverage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.e2e') });

export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] Cleaning up...');
  await cleanupTestData();
  if (process.env.E2E_COVERAGE === '1') {
    console.log('[global-teardown] Building the E2E coverage report (coverage/e2e)...');
    await MCR(coverageOptions).generate();
  }
  console.log('[global-teardown] Done.\n');
}
