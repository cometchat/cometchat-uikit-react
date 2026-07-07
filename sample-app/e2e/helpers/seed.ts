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

/**
 * REST API base URL. Read lazily so dotenv values are picked up regardless of
 * import ordering.
 */
function apiBase(): string {
  const appId = process.env.COMETCHAT_APP_ID ?? '';
  const region = process.env.COMETCHAT_REGION ?? 'us';
  return `https://${appId}.api-${region}.cometchat.io/v3`;
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.COMETCHAT_API_KEY ?? '',
    appid: process.env.COMETCHAT_APP_ID ?? '',
  };
}

export const PRIMARY_USER = 'e2e-user-1';
export const SECONDARY_USER = 'e2e-user-2';
export const STRATEGY_GROUP = 'e2e-group-35';

async function apiCall(method: string, path: string, body?: object): Promise<any> {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: apiHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => null);
}

// ─── Agentic Group Chat (ENG-36495) ──────────────────────────────────────────

/** Display names for the agentic test groups (used to open them from the UI). */
export const AGENTIC_GROUP_1_NAME = 'AI Solo E2E';
export const AGENTIC_GROUP_2_NAME = 'AI Squad E2E';

/** Human members of the agentic groups (auto-created if missing). */
const AGENTIC_HUMAN_USERS: { uid: string; name: string }[] = [
  { uid: 'cometchat-uid-1', name: 'Agentic User One' },
  { uid: 'cometchat-uid-2', name: 'Agentic User Two' },
  { uid: 'cometchat-uid-3', name: 'Agentic User Three' },
];

export interface AgenticConfig {
  /** Whether agent UIDs are configured — when false, agentic-group tests skip. */
  enabled: boolean;
  agent1Uid: string;
  agent2Uid: string;
  /** Effective group ids (env value, or deterministic fallback when env is blank). */
  group1Id: string;
  group2Id: string;
  group1Name: string;
  group2Name: string;
  /** UID the agentic-group tests log in as (a human member of both groups). */
  loginUid: string;
  humanUids: string[];
}

/**
 * Resolve agentic-group config from the environment.
 *
 * Read lazily (not at module load) so it picks up dotenv values regardless of
 * import ordering. Group ids fall back to deterministic guids when unset, so the
 * suite is idempotent before you paste the real ids into .env.e2e.
 */
export function getAgenticConfig(): AgenticConfig {
  const agent1Uid = process.env.GROUP_AGENT_1_UID?.trim() ?? '';
  const agent2Uid = process.env.GROUP_AGENT_2_UID?.trim() ?? '';
  return {
    enabled: Boolean(agent1Uid && agent2Uid),
    agent1Uid,
    agent2Uid,
    group1Id: process.env.AGENTIC_GROUP_1_ID?.trim() || 'e2e-agentic-group-1',
    group2Id: process.env.AGENTIC_GROUP_2_ID?.trim() || 'e2e-agentic-group-2',
    group1Name: AGENTIC_GROUP_1_NAME,
    group2Name: AGENTIC_GROUP_2_NAME,
    loginUid: process.env.E2E_AGENTIC_USER_UID?.trim() || AGENTIC_HUMAN_USERS[0].uid,
    humanUids: AGENTIC_HUMAN_USERS.map(u => u.uid),
  };
}

async function ensureUser(uid: string, name: string): Promise<void> {
  const res = await fetch(`${apiBase()}/users/${uid}`, { headers: apiHeaders() });
  if (res.ok) return;
  await apiCall('POST', '/users', { uid, name });
}

async function groupExists(guid: string): Promise<boolean> {
  const res = await fetch(`${apiBase()}/groups/${guid}`, { headers: apiHeaders() });
  return res.ok;
}

async function ensureGroup(guid: string, name: string, owner: string): Promise<boolean> {
  if (await groupExists(guid)) return false;
  await apiCall('POST', '/groups', { guid, name, type: 'public', owner });
  return true;
}

async function addGroupMembers(guid: string, uids: string[]): Promise<void> {
  // Adding an existing member is a no-op on the backend — safe to call every run.
  await apiCall('POST', `/groups/${guid}/members`, { participants: uids });
}

/**
 * Ensure the two agentic test groups exist with the right members.
 *
 * Group 1 (solo):  1 human + 1 agent — agent replies without an @mention.
 * Group 2 (squad): 3 humans + 2 agents — agent replies only when @mentioned.
 *
 * No-op (with a heads-up log) when the agent UIDs aren't configured.
 */
export async function ensureAgenticGroups(): Promise<void> {
  const cfg = getAgenticConfig();
  if (!cfg.enabled) {
    console.log(
      '[seed] GROUP_AGENT_1_UID / GROUP_AGENT_2_UID not set — skipping agentic group setup. Agentic-group tests will be skipped.'
    );
    return;
  }

  // Human members + owner must exist before group creation / membership.
  for (const u of AGENTIC_HUMAN_USERS) {
    await ensureUser(u.uid, u.name);
  }
  const owner = cfg.humanUids[0];

  // Group 1 — solo (1 human + 1 agent)
  const created1 = await ensureGroup(cfg.group1Id, cfg.group1Name, owner);
  await addGroupMembers(cfg.group1Id, [cfg.humanUids[0], cfg.agent1Uid]);
  console.log(
    `[seed] Agentic group 1 "${cfg.group1Name}" (${cfg.group1Id}): ${created1 ? 'created' : 'reused'}`
  );

  // Group 2 — squad (3 humans + 2 agents)
  const created2 = await ensureGroup(cfg.group2Id, cfg.group2Name, owner);
  await addGroupMembers(cfg.group2Id, [...cfg.humanUids, cfg.agent1Uid, cfg.agent2Uid]);
  console.log(
    `[seed] Agentic group 2 "${cfg.group2Name}" (${cfg.group2Id}): ${created2 ? 'created' : 'reused'}`
  );

  // Nudge the user to pin the ids in .env.e2e so later runs don't rely on the fallback.
  if (!process.env.AGENTIC_GROUP_1_ID?.trim()) {
    console.log(`   ↳ Add to .env.e2e:  AGENTIC_GROUP_1_ID=${cfg.group1Id}`);
  }
  if (!process.env.AGENTIC_GROUP_2_ID?.trim()) {
    console.log(`   ↳ Add to .env.e2e:  AGENTIC_GROUP_2_ID=${cfg.group2Id}`);
  }
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
  const res = await fetch(`${apiBase()}/users/${PRIMARY_USER}`, { headers: apiHeaders() });
  if (!res.ok) {
    throw new Error(
      `Primary test user "${PRIMARY_USER}" not found. Run "npm run e2e:seed" first to create baseline data.`
    );
  }
  console.log(`[seed] Primary user verified: ${PRIMARY_USER}`);

  // Send a message to Strategy group to bring it to top of conversations
  const strategyRes = await fetch(`${apiBase()}/messages`, {
    method: 'POST',
    headers: { ...apiHeaders(), onBehalfOf: PRIMARY_USER },
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
