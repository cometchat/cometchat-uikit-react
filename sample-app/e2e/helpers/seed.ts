/**
 * E2E Seed & Cleanup Helper (REST API)
 *
 * Called by global-setup and global-teardown.
 * Ensures per-run readiness without modifying permanent seed data.
 *
 * Chat assignment strategy:
 * - Bob (e2e-user-2): static, never modified by tests
 * - Design Team (e2e-group-1): static, >30 msgs for pagination
 * - Strategy (e2e-group-35): mutable, used for send/edit/delete/thread tests
 */

const APP_ID = process.env.COMETCHAT_APP_ID ?? '';
const REGION = process.env.COMETCHAT_REGION ?? 'us';
const API_KEY = process.env.COMETCHAT_API_KEY ?? '';
const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: API_KEY,
  appid: APP_ID,
};

export const PRIMARY_USER = 'e2e-user-1';
export const SECONDARY_USER = 'e2e-user-2';
export const STRATEGY_GROUP = 'e2e-group-35';

async function apiCall(method: string, path: string, body?: object): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => null);
}

/**
 * Seed test data before the suite.
 *
 * - Verifies primary user exists
 * - Sends a message to Strategy group to bring it to top of conversations list
 * - Does NOT modify Bob chat (static)
 */
export async function seedTestData(): Promise<void> {
  // Verify primary user exists
  const res = await fetch(`${API_BASE}/users/${PRIMARY_USER}`, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(
      `Primary test user "${PRIMARY_USER}" not found. Run "npm run e2e:seed" first to create baseline data.`
    );
  }
  console.log(`[seed] Primary user verified: ${PRIMARY_USER}`);

  // Send a message to Strategy group to bring it to top of conversations
  const strategyRes = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { ...HEADERS, onBehalfOf: PRIMARY_USER },
    body: JSON.stringify({
      receiver: STRATEGY_GROUP,
      receiverType: 'group',
      category: 'message',
      type: 'text',
      data: { text: `E2E session started [${Date.now()}]` },
    }),
  });
  console.log(`[seed] Strategy group message: ${strategyRes.ok ? 'OK' : 'FAILED'}`);
}

/**
 * Clean up ephemeral test data after the suite.
 * The permanent baseline data (users, groups, Bob chat) is left intact.
 */
export async function cleanupTestData(): Promise<void> {
  console.log('[teardown] Nothing to clean yet.');
}
