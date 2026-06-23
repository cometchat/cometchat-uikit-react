import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedTestData } from './helpers/seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.e2e') });

export default async function globalSetup(): Promise<void> {
  console.log('\n[global-setup] Verifying E2E test data...');
  await seedTestData();
  console.log('[global-setup] Ready.\n');
}
