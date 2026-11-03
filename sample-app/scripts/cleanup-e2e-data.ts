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
 *   npm run e2e:cleanup                 # everything above (resets the app)
 *   npm run e2e:cleanup -- --leftovers  # only throwaway data a run left behind
 *
 * --leftovers keeps the baseline e2e-user-1…35 and e2e-group-1…35 that the seed creates, and
 * removes only E2E_Test_* groups and e2e-*-tmp-* / e2e-user-journey-* fixtures. Deleting and
 * re-seeding the baseline between back-to-back runs recreates groups under the same GUID,
 * which is slow and churns server-side state for no benefit.
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

async function listThrowawayUsers(): Promise<string[]> {
  const uids: string[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const res = await fetch(`${BASE_URL}/users?perPage=${perPage}&page=${page}&searchKey=e2e-user-`, { headers: HEADERS });
    const data = await res.json().catch(() => ({ data: [] }));
    const users = (data?.data ?? []) as { uid?: string }[];
    if (users.length === 0) break;
    for (const u of users) {
      const uid = u.uid ?? '';
      if (uid.startsWith('e2e-user-tmp-') || uid.startsWith('e2e-user-journey-')) uids.push(uid);
    }
    if (users.length < perPage) break;
    page++;
  }
  return uids;
}

const LEFTOVERS_ONLY = process.argv.includes('--leftovers');

async function main() {
  console.log(LEFTOVERS_ONLY ? '🧹 E2E Cleanup Script (leftovers only)' : '🧹 E2E Cleanup Script');
  console.log(`   App ID: ${APP_ID}`);
  console.log(`   Region: ${REGION}`);
  console.log('');

  // ─── Delete Groups ─────────────────────────────────────────────────────────
  console.log('🗑️  Deleting E2E groups...');

  // Delete known e2e-group-* groups
  if (!LEFTOVERS_ONLY) {
    for (let i = 1; i <= 35; i++) {
      await deleteGroup(`e2e-group-${i}`);
    }
  }

  // Also find and delete any E2E_Test_* groups (by name) from create-group tests
  const extraGroups = await listGroups();
  // Anything not already deleted by number above: E2E_Test_* (UI-created) and
  // e2e-group-tmp-* (throwaway fixtures left by a run that died early).
  const numbered = new Set(Array.from({ length: 35 }, (_, i) => `e2e-group-${String(i + 1)}`));
  for (const guid of extraGroups) {
    if (!numbered.has(guid)) {
      await deleteGroup(guid);
    }
  }
  console.log(`   Done. ${deletedGroups} deleted, ${failedGroups} failed.\n`);

  // ─── Delete Users ──────────────────────────────────────────────────────────
  console.log('🗑️  Deleting E2E users...');
  if (!LEFTOVERS_ONLY) {
    for (let i = 1; i <= 35; i++) {
      await deleteUser(`e2e-user-${i}`);
    }
  }
  // Throwaway users left by a run that died early (e2e-user-tmp-*, e2e-user-journey-*).
  for (const uid of await listThrowawayUsers()) {
    await deleteUser(uid);
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
  console.log(
    LEFTOVERS_ONLY
      ? '\n✅ Cleanup complete. Leftovers removed; the seeded baseline is kept.'
      : '\n✅ Cleanup complete. App is reset to empty state.'
  );
  console.log('   Note: "AI Agent E2E" user was NOT deleted (manually managed).\n');
}

main().catch(err => {
  console.error('\n❌ Cleanup failed:', err);
  process.exit(1);
});
