/**
 * E2E Cleanup Script — removes all E2E-created data from a CometChat app.
 *
 * Deletes:
 * - All users matching e2e-user-* pattern
 * - All groups matching e2e-group-* pattern
 * - All groups matching E2E_Test_* pattern (created by create-group tests)
 *
 * Does NOT delete:
 * - "AI Agent E2E" user (manually managed via dashboard)
 * - Any other non-E2E data
 *
 * Usage:
 *   npm run e2e:cleanup
 *
 * Requires: sample-app/.env.e2e with APP_ID, REGION, API_KEY
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.e2e') });

const APP_ID = process.env.COMETCHAT_APP_ID ?? '';
const REGION = process.env.COMETCHAT_REGION ?? '';
const API_KEY = process.env.COMETCHAT_API_KEY ?? '';

if (!APP_ID || !REGION || !API_KEY) {
  console.error('❌ Missing credentials. Ensure .env.e2e has APP_ID, REGION, and API_KEY.');
  process.exit(1);
}

const BASE_URL = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
const HEADERS = {
  'Content-Type': 'application/json',
  apikey: API_KEY,
  appid: APP_ID,
};

let deletedUsers = 0;
let deletedGroups = 0;
let failedUsers = 0;
let failedGroups = 0;

async function deleteUser(uid: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/${uid}`, {
    method: 'DELETE',
    headers: HEADERS,
    body: JSON.stringify({ permanent: true }),
  });
  if (res.ok) {
    deletedUsers++;
  } else {
    const data = await res.json().catch(() => ({}));
    if (data?.error?.code !== 'ERR_UID_NOT_FOUND') {
      failedUsers++;
      console.error(`  ❌ Failed to delete user ${uid}: ${data?.error?.message ?? res.status}`);
    }
  }
}

async function deleteGroup(guid: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/groups/${guid}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (res.ok) {
    deletedGroups++;
  } else {
    const data = await res.json().catch(() => ({}));
    if (data?.error?.code !== 'ERR_GUID_NOT_FOUND') {
      failedGroups++;
      console.error(`  ❌ Failed to delete group ${guid}: ${data?.error?.message ?? res.status}`);
    }
  }
}

async function listGroups(): Promise<string[]> {
  const guids: string[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(`${BASE_URL}/groups?perPage=${perPage}&page=${page}`, {
      headers: HEADERS,
    });
    const data = await res.json().catch(() => ({ data: [] }));
    const groups = data?.data ?? [];
    if (groups.length === 0) break;

    for (const g of groups) {
      const guid = g.guid ?? '';
      const name = g.name ?? '';
      if (guid.startsWith('e2e-group-') || name.startsWith('E2E_Test_')) {
        guids.push(guid);
      }
    }

    if (groups.length < perPage) break;
    page++;
  }

  return guids;
}

async function main() {
  console.log('🧹 E2E Cleanup Script');
  console.log(`   App ID: ${APP_ID}`);
  console.log(`   Region: ${REGION}`);
  console.log('');

  // ─── Delete Groups ─────────────────────────────────────────────────────────
  console.log('🗑️  Deleting E2E groups...');

  // Delete known e2e-group-* groups
  for (let i = 1; i <= 35; i++) {
    await deleteGroup(`e2e-group-${i}`);
  }

  // Also find and delete any E2E_Test_* groups (by name) from create-group tests
  const extraGroups = await listGroups();
  for (const guid of extraGroups) {
    if (!guid.startsWith('e2e-group-')) {
      await deleteGroup(guid);
    }
  }
  console.log(`   Done. ${deletedGroups} deleted, ${failedGroups} failed.\n`);

  // ─── Delete Users ──────────────────────────────────────────────────────────
  console.log('🗑️  Deleting E2E users...');
  for (let i = 1; i <= 35; i++) {
    await deleteUser(`e2e-user-${i}`);
  }
  console.log(`   Done. ${deletedUsers} deleted, ${failedUsers} failed.\n`);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Cleanup Summary:');
  console.log(`   Users deleted:  ${deletedUsers}`);
  console.log(`   Groups deleted: ${deletedGroups}`);
  if (failedUsers || failedGroups) {
    console.log(`   ⚠️  Failures: ${failedUsers} users, ${failedGroups} groups`);
  }
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n✅ Cleanup complete. App is reset to empty state.');
  console.log('   Note: "AI Agent E2E" user was NOT deleted (manually managed).\n');
}

main().catch(err => {
  console.error('\n❌ Cleanup failed:', err);
  process.exit(1);
});
