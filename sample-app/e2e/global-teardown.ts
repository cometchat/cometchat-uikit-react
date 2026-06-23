import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupTestData } from './helpers/seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.e2e') });

export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] Cleaning up...');
  await cleanupTestData();
  console.log('[global-teardown] Done.\n');
}
