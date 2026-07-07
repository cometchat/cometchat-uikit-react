/**
 * E2E Seed Script — populates a CometChat app with baseline test data via REST API.
 *
 * Idempotent: safe to run multiple times. Skips existing resources.
 * Uses CometChat REST API (no browser SDK dependency).
 *
 * Usage:
 *   npm run e2e:seed
 *
 * Requires: sample-app/.env.e2e with APP_ID, REGION, AUTH_KEY, API_KEY
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.e2e') });

// Provisions the agentic test groups (ENG-36495). Safe regardless of import
// ordering — the helper reads env lazily at call time, not at module load.
// No-op unless GROUP_AGENT_1_UID / GROUP_AGENT_2_UID are set.
import { ensureAgenticGroups } from '../e2e/helpers/seed';

const APP_ID = process.env.COMETCHAT_APP_ID ?? '';
const REGION = process.env.COMETCHAT_REGION ?? '';
const AUTH_KEY = process.env.COMETCHAT_AUTH_KEY ?? '';
const API_KEY = process.env.COMETCHAT_API_KEY ?? '';

if (!APP_ID || !REGION || !API_KEY) {
  console.error('❌ Missing credentials. Copy .env.e2e.example to .env.e2e and fill in values.');
  process.exit(1);
}

const BASE_URL = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
const HEADERS = {
  'Content-Type': 'application/json',
  apikey: API_KEY,
  appid: APP_ID,
};

// ─── REST API Helpers ────────────────────────────────────────────────────────

async function apiCall(method: string, path: string, body?: object): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ─── Data ────────────────────────────────────────────────────────────────────

const AVATARS = [
  'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
  'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png',
  'https://data-us.cometchat.io/assets/images/avatars/spiderman.png',
  'https://data-us.cometchat.io/assets/images/avatars/wolverine.png',
  'https://data-us.cometchat.io/assets/images/avatars/cyclops.png',
];

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack',
  'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Ryan', 'Sara', 'Tom',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zane', 'Amelia', 'Blake', 'Cora', 'Derek',
  'Elena', 'Finn', 'Gina', 'Hugo', 'Isla',
];

const LAST_NAMES = [
  'Johnson', 'Smith', 'Brown', 'Prince', 'Wilson', 'Miller', 'Lee', 'Adams', 'Chen', 'Taylor',
  'Davis', 'Garcia', 'Martinez', 'Clark', 'Lewis', 'Young', 'King', 'Wright', 'Hill', 'Scott',
  'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan',
  'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper',
];

const GROUP_NAMES = [
  'Design Team', 'Engineering', 'Marketing', 'Sales', 'Support',
  'Product', 'QA Team', 'DevOps', 'Frontend', 'Backend',
  'Mobile', 'Data Science', 'Research', 'HR Team', 'Finance',
  'Legal', 'Operations', 'Security', 'Platform', 'Infrastructure',
  'Growth', 'Content', 'Analytics', 'Partnerships', 'Community',
  'Docs Team', 'Release', 'Architecture', 'Performance', 'Accessibility',
  'Localization', 'Testing', 'CI/CD', 'Onboarding', 'Strategy',
];

const stats = { usersCreated: 0, usersSkipped: 0, groupsCreated: 0, groupsSkipped: 0, messagesSent: 0, messagesSkipped: 0 };

// ─── Create User ─────────────────────────────────────────────────────────────

async function createUser(uid: string, name: string, avatar: string): Promise<void> {
  const res = await apiCall('POST', '/users', { uid, name, avatar });
  if (res.ok) {
    stats.usersCreated++;
    console.log(`  ✅ Created user: ${uid} (${name})`);
  } else if (res.data?.error?.code === 'ERR_UID_ALREADY_EXISTS') {
    stats.usersSkipped++;
  } else {
    console.error(`  ❌ Failed to create user ${uid}:`, res.data?.error?.message ?? res.status);
  }
}

// ─── Create Group ────────────────────────────────────────────────────────────

async function createGroup(guid: string, name: string, type: string, owner: string, password?: string): Promise<void> {
  const body: any = { guid, name, type, owner };
  if (password) body.password = password;
  const res = await apiCall('POST', '/groups', body);
  if (res.ok) {
    stats.groupsCreated++;
    console.log(`  ✅ Created group: ${guid} (${name})`);
  } else if (res.data?.error?.code === 'ERR_GUID_ALREADY_EXISTS') {
    stats.groupsSkipped++;
  } else {
    console.error(`  ❌ Failed to create group ${guid}:`, res.data?.error?.message ?? res.status);
  }
}

// ─── Add Members ─────────────────────────────────────────────────────────────

async function addMembers(guid: string, memberUids: string[]): Promise<void> {
  await apiCall('POST', `/groups/${guid}/members`, { participants: memberUids });
}

// ─── Send Message ────────────────────────────────────────────────────────────

async function sendMessage(senderUid: string, receiverUid: string, text: string, receiverType: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { ...HEADERS, onBehalfOf: senderUid },
    body: JSON.stringify({
      receiver: receiverUid,
      receiverType,
      category: 'message',
      type: 'text',
      data: { text },
    }),
  });
  if (res.ok) {
    stats.messagesSent++;
    return true;
  }
  return false;
}

// ─── Check Messages Exist ────────────────────────────────────────────────────

async function conversationHasMessages(uid1: string, uid2: string): Promise<boolean> {
  // Use onBehalfOf header to check as uid1
  const res = await fetch(`${BASE_URL}/users/${uid2}/messages?limit=1`, {
    headers: { ...HEADERS, onBehalfOf: uid1 },
  });
  const data = await res.json().catch(() => ({ data: [] }));
  return Array.isArray(data?.data) && data.data.length > 0;
}

async function groupHasMessages(guid: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/groups/${guid}/messages?limit=1&category=message`, {
    headers: { ...HEADERS, onBehalfOf: 'e2e-user-1' },
  });
  const data = await res.json().catch(() => ({ data: [] }));
  return Array.isArray(data?.data) && data.data.length > 0;
}

/**
 * Count real (non-action) messages in a group.
 * Only counts messages with category=message (excludes group actions, calls, etc.)
 */
async function groupTextMessageCount(guid: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/groups/${guid}/messages?limit=100&category=message`, {
    headers: { ...HEADERS, onBehalfOf: 'e2e-user-1' },
  });
  const data = await res.json().catch(() => ({ data: [] }));
  return Array.isArray(data?.data) ? data.data.length : 0;
}

function generateGroupMessages(count: number): { sender: string; text: string }[] {
  const members = ['e2e-user-1', 'e2e-user-2', 'e2e-user-3', 'e2e-user-4', 'e2e-user-5'];
  const texts = [
    'Welcome everyone!', 'Hey all! Glad to be here.', 'Hi team 👋', 'Looking forward to collaborating!',
    'What are we working on first?', "Let's start with the redesign.", 'I can take the button component.',
    "I'll handle inputs.", 'I can work on modals.', 'I will take navigation.',
    'Perfect. Deadline is next Friday.', 'Should we use Figma?', "Figma — better for collab.",
    'Agreed. Sharing is easier.', "Started a file. Link in desc.", 'Got it. Adding frames now.',
    'Remember the 8px grid.', 'Use design tokens for colors.', 'What about font sizes?',
    'Stick with the type scale.', 'Border radius: 8px or 12px?', '8px small, 12px cards.',
    'Makes sense.', 'Button variants done!', 'Great work! Reviewing now.', 'Input fields done too.',
    'Modal taking longer — animation tricky.', 'Take your time. Quality first.', 'Navigation 80% done.',
    "We're on track! 🎉", '🙌', '💪', 'Modal done! With spring animations.',
    'Navigation complete.', "Incredible. Let's celebrate! 🍕", 'Pizza party!', 'Count me in!',
    '🍕🍕🍕', 'Best team ever.', 'Ship it! 🚀',
  ];
  const messages: { sender: string; text: string }[] = [];
  for (let i = 0; i < count; i++) {
    messages.push({ sender: members[i % members.length], text: texts[i % texts.length] });
  }
  return messages;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 E2E Seed Script (REST API)');
  console.log(`   App ID: ${APP_ID}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log('');

  // ─── Step 1: Create 35 Users ───────────────────────────────────────────────
  console.log('📦 Creating 35 users...');
  for (let i = 0; i < 35; i++) {
    const uid = `e2e-user-${i + 1}`;
    const name = `${FIRST_NAMES[i]} ${LAST_NAMES[i]}`;
    const avatar = AVATARS[i % AVATARS.length];
    await createUser(uid, name, avatar);
  }
  console.log(`   Done. ${stats.usersCreated} created, ${stats.usersSkipped} already existed.\n`);

  // ─── Step 2: Create 35 Groups ──────────────────────────────────────────────
  console.log('📦 Creating 35 groups...');
  for (let i = 0; i < 35; i++) {
    const guid = `e2e-group-${i + 1}`;
    const name = GROUP_NAMES[i];
    // group-2 is private, group-3 is password-protected
    const type = i === 1 ? 'private' : i === 2 ? 'password' : 'public';
    const password = i === 2 ? 'test123' : undefined;
    await createGroup(guid, name, type, 'e2e-user-1', password);
  }
  console.log(`   Done. ${stats.groupsCreated} created, ${stats.groupsSkipped} already existed.\n`);

  // ─── Step 3: Add Members ───────────────────────────────────────────────────
  console.log('👥 Adding group members...');
  // First 5 groups get 4 extra members
  for (let i = 0; i < 5; i++) {
    await addMembers(`e2e-group-${i + 1}`, ['e2e-user-2', 'e2e-user-3', 'e2e-user-4', 'e2e-user-5']);
  }
  // Design Team (group-1) gets ALL 35 users for member pagination tests
  const allMemberUids = Array.from({ length: 34 }, (_, i) => `e2e-user-${i + 2}`); // user-2 through user-35
  await addMembers('e2e-group-1', allMemberUids);
  // group-2 (private) gets extra members for scope/kick/ban tests
  await addMembers('e2e-group-2', ['e2e-user-6', 'e2e-user-7']);
  // Remaining groups get user-2
  for (let i = 5; i < 35; i++) {
    await addMembers(`e2e-group-${i + 1}`, ['e2e-user-2']);
  }
  console.log('   Done.\n');

  // ─── Step 4: Seed Bob chat (user-1 ↔ user-2, exactly 4 messages: 2 outgoing + 2 incoming) ─────────────
  console.log('💬 Seeding Bob chat: user-1 ↔ user-2 (4 messages)...');
  const has12 = await conversationHasMessages('e2e-user-1', 'e2e-user-2');
  if (!has12) {
    const bobMessages = [
      { sender: 'e2e-user-1', receiver: 'e2e-user-2', text: 'Hey Bob, how are you doing?' },
      { sender: 'e2e-user-2', receiver: 'e2e-user-1', text: 'Hey Alice! All good. Working on the new feature.' },
      { sender: 'e2e-user-1', receiver: 'e2e-user-2', text: 'Nice! Let me know if you need help with anything.' },
      { sender: 'e2e-user-2', receiver: 'e2e-user-1', text: 'Will do. Thanks!' },
    ];
    for (const msg of bobMessages) {
      await sendMessage(msg.sender, msg.receiver, msg.text, 'user');
    }
    console.log('   ✅ Sent 4 messages (2 outgoing + 2 incoming).');
  } else {
    stats.messagesSkipped += 4;
    console.log('   ⏭️  Already has messages.');
  }
  console.log('');
  console.log('');

  // ─── Step 5: Seed Group Messages (e2e-group-1 "Design Team", 40 messages) ────────────────
  console.log('💬 Seeding group messages: e2e-group-1 "Design Team" (40 messages)...');
  const g1TextCount = await groupTextMessageCount('e2e-group-1');
  if (g1TextCount < 40) {
    const gMsgs = generateGroupMessages(40);
    for (const msg of gMsgs) {
      await sendMessage(msg.sender, 'e2e-group-1', msg.text, 'group');
    }
    console.log(`   ✅ Sent 40 group messages (had ${g1TextCount} text messages before).`);
  } else {
    stats.messagesSkipped += 40;
    console.log('   ⏭️  Already has messages.');
  }
  console.log('');

  // ─── Step 6: Seed Strategy group (e2e-group-35) with initial message ───────
  console.log('💬 Seeding Strategy group (e2e-group-35) with initial message...');
  const hasStrategy = await groupHasMessages('e2e-group-35');
  if (!hasStrategy) {
    await sendMessage('e2e-user-1', 'e2e-group-35', 'Strategy group initialized for E2E testing.', 'group');
    console.log('   ✅ Sent initial message to Strategy group.');
  } else {
    stats.messagesSkipped += 1;
    console.log('   ⏭️  Already has messages.');
  }
  console.log('');

  // ─── Step 6b: Seed CI/CD group (e2e-group-33) with incoming messages for message-privately tests ───
  console.log('💬 Seeding CI/CD group (e2e-group-33) with incoming messages...');
  // Ensure user-2 is a member (needed to send messages onBehalfOf user-2)
  await addMembers('e2e-group-33', ['e2e-user-2']);
  await sendMessage('e2e-user-1', 'e2e-group-33', 'CI/CD group initialized.', 'group');
  await sendMessage('e2e-user-2', 'e2e-group-33', 'Hey team, the pipeline is green!', 'group');
  await sendMessage('e2e-user-2', 'e2e-group-33', 'Deploying to staging now.', 'group');
  console.log('   ✅ Sent 3 messages (1 outgoing + 2 incoming from user-2).');

  // ─── Step 6c: Seed AI Agent E2E conversation (ensure it appears in conversations list) ───
  console.log('🤖 Seeding AI Agent E2E conversation...');
  const AI_AGENT_UID = process.env.AI_AGENT_UID || 'ai-agent-e2e';
  
  const sent = await sendMessage('e2e-user-1', AI_AGENT_UID, 'Hello, AI Agent!', 'user');
  if (sent) {
    console.log(`   ✅ Sent message to AI Agent (${AI_AGENT_UID}) — conversation exists.`);
  } else {
    console.log(`   ⚠️  AI Agent user "${AI_AGENT_UID}" not found or message failed. Skipping.`);
    console.log('      Create it manually in dashboard (BYO Agents → @agentic role → name "AI Agent E2E").');
  }
  console.log('');

  // ─── Step 7: Seed messages in groups 2-15 to populate conversations list (>10 items) ───
  console.log('💬 Seeding 1 message each in groups 2-15 (for conversations scroll test)...');
  for (let i = 2; i <= 15; i++) {
    const guid = `e2e-group-${i}`;
    const hasMsg = await groupHasMessages(guid);
    if (!hasMsg) {
      await sendMessage('e2e-user-1', guid, `Hello from ${GROUP_NAMES[i - 1]}!`, 'group');
      console.log(`   ✅ Sent to ${guid} (${GROUP_NAMES[i - 1]})`);
    } else {
      stats.messagesSkipped++;
    }
  }
  console.log('   Done.\n');

  // ─── Step 8: Seed agentic group chat groups (ENG-36495) ────────────────────
  console.log('🤖 Ensuring agentic group chat groups...');
  await ensureAgenticGroups();
  console.log('');

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   Users:    ${stats.usersCreated} created, ${stats.usersSkipped} skipped (35 total)`);
  console.log(`   Groups:   ${stats.groupsCreated} created, ${stats.groupsSkipped} skipped (35 total)`);
  console.log(`   Messages: ${stats.messagesSent} sent, ${stats.messagesSkipped} skipped`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n✅ Seed complete! App is ready for E2E testing.');
  console.log('   Primary test user: e2e-user-1 (Alice Johnson)');
  console.log('   Login with this UID in the sample app.\n');
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
