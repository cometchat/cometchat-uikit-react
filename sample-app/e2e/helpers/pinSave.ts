import { Page, expect } from '@playwright/test';
import { openActionSheet, bubbleWithText } from './threads';

/**
 * Helpers for the Pin & Save suites (pin/save messages + pin conversation).
 *
 * Two kinds:
 *  - REST helpers (management API, apikey + onBehalfOf) that seed and *clear*
 *    state, so each test starts from a known slate without depending on order.
 *    The pin/save limits are low, so "clear everything first" is a few calls.
 *  - UI helpers for the surfaces under test: the message action sheet, the
 *    pinned/saved panels, the bubble indicators, and the conversation row menu.
 *
 * Endpoint shapes were taken from the client API (network tab) and pointed at
 * the management API the rest of the suite uses. If a path differs on your app,
 * it's a one-line edit here.
 */

// ─── Identities / entities ───────────────────────────────────────────────────

export const STRATEGY_GROUP = 'e2e-group-35';
export const PRIMARY_UID = 'e2e-user-1';
export const SECONDARY_UID = 'e2e-user-2'; // Bob Smith — read-only; used to send incoming messages

/** A non-privileged member of Strategy: sees Save but never Pin. */
export const STRATEGY_PARTICIPANT_UID = 'e2e-user-2';

// ─── Copy under test (one-line edits on a wording change) ─────────────────────

export const PIN_MESSAGE_OPTION = 'Pin message';
export const UNPIN_MESSAGE_OPTION = 'Unpin message';
export const SAVE_MESSAGE_OPTION = 'Save message';
export const UNSAVE_MESSAGE_OPTION = 'Unsave message';
export const UNPIN_CONFIRM_CTA = 'Unpin'; // confirm dialog CTA (title: "Unpin Message")
export const UNSAVE_CONFIRM_CTA = 'Unsave'; // confirm dialog CTA (title: "Unsave Message")
// In the main message list, pin/save options are nested under an "Organize ▸"
// fly-out when more than one survives; a lone option stays flat (e.g. a
// participant who can only Save).
export const ORGANIZE_OPTION = 'Organize';

export const PIN_CONVERSATION_OPTION = 'Pin conversation';
export const UNPIN_CONVERSATION_OPTION = 'Unpin conversation';

export const GENERIC_ERROR_TOAST = 'Something went wrong. Please try again.';
export const pinLimitToast = (limit: number) =>
  `You can only pin ${String(limit)} messages. Unpin one to pin another.`;

/** Shown when the server rejects a pin/unpin for lack of permission (`action_permission_denied`). */
export const PERMISSION_DENIED_TOAST = "You don't have permission to perform this action.";
/** Subtitle of the pinned panel's generic error state (shown when the listing is denied). */
export const PANEL_ERROR_SUBTITLE = 'Looks like something went wrong';

// ─── REST config ─────────────────────────────────────────────────────────────

function restBase(): string {
  const appId = process.env.COMETCHAT_APP_ID ?? '';
  const region = process.env.COMETCHAT_REGION ?? 'us';
  return `https://${appId}.api-${region}.cometchat.io/v3`;
}

/** Acts as a specific user (per-user pins/saves are scoped by onBehalfOf). */
function userHeaders(onBehalfOf: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.COMETCHAT_API_KEY ?? '',
    appid: process.env.COMETCHAT_APP_ID ?? '',
    onBehalfOf,
  };
}

/** Admin-scoped (no onBehalfOf) — for system/admin pins. */
function adminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.COMETCHAT_API_KEY ?? '',
    appid: process.env.COMETCHAT_APP_ID ?? '',
  };
}

/**
 * Throw with the server's status + body when a seed/cleanup REST call fails.
 *
 * Pin/save writes used to `await fetch(...)` and drop the result, so a backend
 * rejection (feature disabled, endpoint not deployed, permission) was a silent
 * no-op: the message simply wasn't pinned/saved and the UI assertion later timed
 * out with no clue why. Surfacing the response turns that into an actionable error.
 */
async function assertOk(res: Response, label: string): Promise<void> {
  if (res.ok) return;
  let body = '';
  try {
    body = await res.text();
  } catch {
    body = '(no body)';
  }
  throw new Error(`${label} failed: ${String(res.status)} ${res.statusText} — ${body}`);
}

interface MessageIdRow {
  id?: string | number;
}

// ─── REST: send ──────────────────────────────────────────────────────────────

interface SendToGroupOptions {
  guid: string;
  as: string;
  text: string;
  parentMessageId?: number;
}

/** Send a text message to any group over REST. Returns the new message id. */
export async function sendMessageToGroup({
  guid,
  as,
  text,
  parentMessageId,
}: SendToGroupOptions): Promise<number> {
  const body: Record<string, unknown> = {
    receiver: guid,
    receiverType: 'group',
    category: 'message',
    type: 'text',
    data: { text },
  };
  if (parentMessageId) body.parentMessageId = String(parentMessageId);

  const url = parentMessageId
    ? `${restBase()}/messages/${String(parentMessageId)}/thread`
    : `${restBase()}/messages`;

  const res = await fetch(url, { method: 'POST', headers: userHeaders(as), body: JSON.stringify(body) });
  const payload = (await res.json()) as { data?: { id?: string | number; parentId?: string | number } };
  const id = Number(payload.data?.id);
  if (!id) throw new Error(`sendMessageToGroup failed as ${as}: ${JSON.stringify(payload)}`);
  if (parentMessageId && Number(payload.data?.parentId) !== parentMessageId) {
    throw new Error(
      `Reply ${String(id)} did not thread under ${String(parentMessageId)} (got ${String(payload.data?.parentId)}).`
    );
  }
  return id;
}

/** Convenience: send to the Strategy group. */
export function sendStrategyMessage(opts: Omit<SendToGroupOptions, 'guid'>): Promise<number> {
  return sendMessageToGroup({ guid: STRATEGY_GROUP, ...opts });
}

/** Send a 1:1 text message over REST. Returns the new message id. */
export async function sendDirectMessage({
  from,
  to,
  text,
}: {
  from: string;
  to: string;
  text: string;
}): Promise<number> {
  const res = await fetch(`${restBase()}/messages`, {
    method: 'POST',
    headers: userHeaders(from),
    body: JSON.stringify({
      receiver: to,
      receiverType: 'user',
      category: 'message',
      type: 'text',
      data: { text },
    }),
  });
  const payload = (await res.json()) as { data?: { id?: string | number } };
  const id = Number(payload.data?.id);
  if (!id) throw new Error(`sendDirectMessage failed ${from}→${to}: ${JSON.stringify(payload)}`);
  return id;
}

/** Resolve a group's guid by exact display name (CI/CD, Testing, …). */
export async function resolveGroupGuid(name: string): Promise<string> {
  const res = await fetch(`${restBase()}/groups?per_page=100`, { headers: adminHeaders() });
  const payload = (await res.json()) as { data?: { guid: string; name: string }[] };
  const match = (payload.data ?? []).find(g => g.name === name);
  if (!match) {
    throw new Error(
      `Group named "${name}" not found via REST (searched the first 100 groups). ` +
        `Create it, or check the name.`
    );
  }
  return match.guid;
}

// ─── REST: pin / save messages ───────────────────────────────────────────────

/** Every pinned message id in a group (as seen by `asUid`). Limit is low, so one high page covers all. */
export async function getPinnedMessageIds(guid: string, asUid: string): Promise<number[]> {
  const res = await fetch(
    `${restBase()}/groups/${guid}/messages?per_page=100&pinned=1&affix=prepend`,
    { headers: userHeaders(asUid) }
  );
  const payload = (await res.json()) as { data?: MessageIdRow[] };
  return (payload.data ?? []).map(m => Number(m.id)).filter(Boolean);
}

export async function pinMessageRest(id: number, asUid: string): Promise<void> {
  const res = await fetch(`${restBase()}/messages/${String(id)}/pin`, {
    method: 'POST',
    headers: userHeaders(asUid),
  });
  await assertOk(res, `pinMessageRest(${String(id)}, ${asUid})`);
}

export async function unpinMessageRest(id: number, asUid: string): Promise<void> {
  const res = await fetch(`${restBase()}/messages/${String(id)}/pin`, {
    method: 'DELETE',
    headers: userHeaders(asUid),
  });
  await assertOk(res, `unpinMessageRest(${String(id)}, ${asUid})`);
}

/** Clear the group's pinned messages so a test starts from an empty pinned list. */
export async function clearPinnedMessages(guid: string, asUid: string): Promise<void> {
  const ids = await getPinnedMessageIds(guid, asUid);
  for (const id of ids) {
    await unpinMessageRest(id, asUid);
  }
}

/** Every saved message id for `asUid` (saves span all conversations). */
export async function getSavedMessageIds(asUid: string): Promise<number[]> {
  const res = await fetch(`${restBase()}/messages?per_page=100&saved=1&affix=prepend`, {
    headers: userHeaders(asUid),
  });
  const payload = (await res.json()) as { data?: MessageIdRow[] };
  return (payload.data ?? []).map(m => Number(m.id)).filter(Boolean);
}

export async function saveMessageRest(id: number, asUid: string): Promise<void> {
  const res = await fetch(`${restBase()}/messages/${String(id)}/save`, {
    method: 'POST',
    headers: userHeaders(asUid),
  });
  await assertOk(res, `saveMessageRest(${String(id)}, ${asUid})`);
}

export async function unsaveMessageRest(id: number, asUid: string): Promise<void> {
  const res = await fetch(`${restBase()}/messages/${String(id)}/save`, {
    method: 'DELETE',
    headers: userHeaders(asUid),
  });
  await assertOk(res, `unsaveMessageRest(${String(id)}, ${asUid})`);
}

/** Clear the user's saved messages so a test starts from an empty saved list. */
export async function clearSavedMessages(asUid: string): Promise<void> {
  const ids = await getSavedMessageIds(asUid);
  for (const id of ids) {
    await unsaveMessageRest(id, asUid);
  }
}

// ─── REST: pin conversations ─────────────────────────────────────────────────

/** System/admin-pin conversations app-wide (replaces the system-pinned set). */
export async function adminPinConversations(
  items: { guid?: string; uid?: string }[]
): Promise<void> {
  await fetch(`${restBase()}/conversations/pinned`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ pinnedConversations: items }),
  });
}

/** User-unpin a 1:1 (user) conversation for `asUid`. */
export async function userUnpinUserConversation(withUid: string, asUid: string): Promise<void> {
  await fetch(`${restBase()}/users/${withUid}/conversation/pin`, {
    method: 'DELETE',
    headers: userHeaders(asUid),
  });
}

/** User-unpin a group conversation for `asUid` (resets a group pin between tests). */
export async function userUnpinGroupConversation(guid: string, asUid: string): Promise<void> {
  await fetch(`${restBase()}/groups/${guid}/conversation/pin`, {
    method: 'DELETE',
    headers: userHeaders(asUid),
  });
}

// ─── UI: message options / indicators ────────────────────────────────────────

/** Whether a main-list bubble shows the pinned glyph. */
export function pinnedIndicator(bubble: ReturnType<Page['locator']>) {
  return bubble.locator('.cometchat-message-bubble__status-info-view-indicator--pinned');
}

/** Whether a main-list bubble shows the saved glyph. */
export function savedIndicator(bubble: ReturnType<Page['locator']>) {
  return bubble.locator('.cometchat-message-bubble__status-info-view-indicator--saved');
}

/**
 * Locate a message option in an ALREADY-OPEN action sheet, opening the
 * "Organize ▸" submenu if the pin/save option is nested there. Uses EXACT name
 * matching — a substring match on "Pin message" would also hit "Unpin message"
 * (and "Save message" → "Unsave message"). Returns a locator; the caller checks
 * `.isVisible()` / clicks it.
 */
async function messageOptionLocator(page: Page, option: string) {
  const flat = page.getByRole('menuitem', { name: option, exact: true }).first();
  if (await flat.isVisible({ timeout: 1500 }).catch(() => false)) return flat;

  // Not at the first level — it may live under the "Organize" fly-out.
  const organize = page.getByRole('menuitem', { name: ORGANIZE_OPTION, exact: true }).first();
  if (await organize.isVisible({ timeout: 1000 }).catch(() => false)) {
    await organize.click();
    await page
      .waitForSelector('.cometchat-context-menu__submenu-panel', { timeout: 3_000 })
      .catch(() => undefined);
    await page.waitForTimeout(200);
    return page
      .locator('.cometchat-context-menu__submenu-panel')
      .getByRole('menuitem', { name: option, exact: true })
      .first();
  }

  return flat; // absent — caller sees it as not visible
}

/** Open a bubble's action sheet and click the given option (handles "Organize"). */
export async function clickMessageOption(
  page: Page,
  bubble: ReturnType<Page['locator']>,
  option: string
): Promise<void> {
  await openActionSheet(page, bubble);
  await (await messageOptionLocator(page, option)).click();
  await page.waitForTimeout(400);
}

/** Is the given option available (flat or under "Organize")? Closes the sheet afterwards. */
export async function messageOptionVisible(
  page: Page,
  bubble: ReturnType<Page['locator']>,
  option: string
): Promise<boolean> {
  await openActionSheet(page, bubble);
  const present = await (await messageOptionLocator(page, option)).isVisible().catch(() => false);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  return present;
}

export async function unpinMessageUI(page: Page, bubble: ReturnType<Page['locator']>): Promise<void> {
  await openActionSheet(page, bubble);
  await (await messageOptionLocator(page, UNPIN_MESSAGE_OPTION)).click();
  // Unpin is gated behind a confirm dialog.
  await page
    .getByRole('dialog')
    .getByRole('button', { name: UNPIN_CONFIRM_CTA, exact: true })
    .first()
    .click();
  await page.waitForTimeout(500);
}

export async function unsaveMessageUI(page: Page, bubble: ReturnType<Page['locator']>): Promise<void> {
  await openActionSheet(page, bubble);
  await (await messageOptionLocator(page, UNSAVE_MESSAGE_OPTION)).click();
  // Unsave is gated behind a confirm dialog too.
  await page
    .getByRole('dialog')
    .getByRole('button', { name: UNSAVE_CONFIRM_CTA, exact: true })
    .first()
    .click();
  await page.waitForTimeout(500);
}

// ─── UI: pinned panel ────────────────────────────────────────────────────────

/** Open the pinned-messages panel from the message header overflow menu. */
export async function openPinnedPanel(page: Page): Promise<void> {
  // Target the overflow kebab specifically (the search button shares the generic
  // menu-button class), then pick the item by its exact label.
  await page.locator('.cometchat-message-header__overflow-menu button').first().click();
  await page.getByRole('menuitem', { name: 'Pinned Messages', exact: true }).first().click();
  await expect(page.locator('.cometchat-pinned-messages').first()).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(800);
}

/** A row in the pinned panel containing the given text. */
export function pinnedPanelRow(page: Page, text: string) {
  return page.locator('.cometchat-pinned-messages__item').filter({ hasText: text }).first();
}

/** The pinned panel's generic error state subtitle (shown when the listing is denied). */
export function pinnedPanelError(page: Page) {
  return page.locator('.cometchat-pinned-messages__error-subtitle').first();
}

/** The pinned panel's error-state container (present when the listing is denied). */
export function pinnedPanelErrorState(page: Page) {
  return page.locator('.cometchat-pinned-messages__error').first();
}

/**
 * Wait until the pinned panel has settled into a loaded state — the shimmer is
 * gone and it is NOT the error state. Both "loaded with rows" and "empty" qualify;
 * the caller asserts the row (or its absence) after this.
 */
export async function waitForPinnedListSettled(page: Page): Promise<void> {
  await expect(page.locator('.cometchat-pinned-messages__shimmer')).toHaveCount(0, {
    timeout: 10_000,
  });
  await expect(page.locator('.cometchat-pinned-messages__error')).toHaveCount(0, {
    timeout: 10_000,
  });
}

// ─── UI: saved screen ────────────────────────────────────────────────────────

/**
 * Open the saved-messages screen from the conversations header menu.
 *
 * The header menu only exists on the Chats tab — if a test navigated away via
 * Users/Groups (e.g. opening a chat), switch back first. Then open the header
 * kebab and pick "Saved Messages" by its exact label (not by position).
 */
export async function openSavedScreen(page: Page): Promise<void> {
  await openChatsTab(page);
  await page.locator('.cometchat-conversations__header-menu button').first().click();
  await page.getByRole('menuitem', { name: 'Saved Messages', exact: true }).first().click();
  await expect(page.locator('.cometchat-saved-messages').first()).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(800);
}

/** A row in the saved screen containing the given text. */
export function savedScreenRow(page: Page, text: string) {
  return page.locator('.cometchat-saved-messages__item').filter({ hasText: text }).first();
}

// ─── UI: conversation list / pin ─────────────────────────────────────────────

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A conversation row by its EXACT title. A substring match on the whole row is
 * unsafe — a subtitle mentioning "Bob" would win, and a title like "Bob" would
 * match "Bob Smith". Match the title element on `^name$` instead.
 */
export function conversationItem(page: Page, name: string) {
  return page
    .locator('.cometchat-conversations__item')
    .filter({
      has: page.locator('.cometchat-conversations__item-title', {
        hasText: new RegExp(`^${escapeRegExp(name)}$`),
      }),
    })
    .first();
}

/** Open the Chats (conversations) tab. */
export async function openChatsTab(page: Page): Promise<void> {
  await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
  await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
}

/**
 * Open a conversation row's context menu. The row must already be visible in the
 * list — search results don't expose row actions, so callers bring the row into
 * view first (e.g. by sending it a message to bump it to the top).
 */
export async function openConversationRowMenu(page: Page, name: string): Promise<void> {
  await openChatsTab(page);
  const row = conversationItem(page, name);
  await expect(
    row,
    `Conversation "${name}" is not visible in the list — send it a message first (search results don't expose row actions).`
  ).toBeVisible({ timeout: 15_000 });

  await row.hover();
  await page.waitForTimeout(300);
  // With pin enabled, the row's actions collapse into a context menu.
  await row.locator('.cometchat-conversations__item-options button').first().click();
  await page.waitForTimeout(300);
}

/** Pin a conversation from its (already-visible) row context menu. */
export async function pinConversationUI(page: Page, name: string): Promise<void> {
  await openConversationRowMenu(page, name);
  // Exact match — "Pin conversation" is a substring of "Unpin conversation".
  await page.getByRole('menuitem', { name: PIN_CONVERSATION_OPTION, exact: true }).first().click();
  await page.waitForTimeout(600);
}

/** Pinned indicator on a conversation row. */
export function conversationPinIndicator(row: ReturnType<Page['locator']>) {
  return row.locator('.cometchat-conversations__item-pin-indicator');
}

/** Ordered list of conversation display titles, top to bottom. */
export async function conversationTitles(page: Page): Promise<string[]> {
  const titles = await page.locator('.cometchat-conversations__item-title').allTextContents();
  return titles.map(t => t.trim()).filter(Boolean);
}

// ─── Faults ──────────────────────────────────────────────────────────────────

/** Run `fn` with the browser offline, then restore. */
export async function withOffline(page: Page, fn: () => Promise<void>): Promise<void> {
  await page.context().setOffline(true);
  try {
    await fn();
  } finally {
    await page.context().setOffline(false);
  }
}
