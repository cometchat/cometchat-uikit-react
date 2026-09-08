import { Page, Request, expect } from '@playwright/test';

/**
 * Helpers for the thread-subscription suite.
 *
 * Two kinds:
 *  - REST helpers that act as a *second* user, so "someone else replied" and
 *    "someone mentioned me" are real server events rather than simulated ones.
 *  - Wire-level capture, because several rules are only observable in the
 *    request: which message id a subscribe is rooted at, and how many writes a
 *    double-tap produces.
 */

export const STRATEGY_GROUP = 'e2e-group-35';
export const PRIMARY_UID = 'e2e-user-1';
export const SECONDARY_UID = 'e2e-user-2';

/**
 * Display names, needed to pick a specific member out of the composer's mention
 * list (the suggestions show names, not uids). PRIMARY is the logged-in user, so
 * selecting PRIMARY_NAME is how a same-device edit @-mentions *yourself*.
 */
export const PRIMARY_NAME = 'Alice Johnson';
export const SECONDARY_NAME = 'Bob Smith';

/**
 * Copy under test — kept here so a wording change is a one-line edit.
 *
 * The message option and the thread-header bell share one pair of strings, so
 * the same two constants cover both surfaces.
 */
export const SUBSCRIBE_OPTION = 'Subscribe to thread';
export const UNSUBSCRIBE_OPTION = 'Unsubscribe from thread';
export const SUBSCRIBED_TOAST = "Subscribed. You'll be notified about new replies in this thread.";
export const UNSUBSCRIBED_TOAST =
  "Unsubscribed. Notifications are off until you reply or are mentioned.";
export const FAILED_TOAST = "Couldn't update. Please try again.";

function restBase(): string {
  const appId = process.env.COMETCHAT_APP_ID ?? '';
  const region = process.env.COMETCHAT_REGION ?? 'us';
  return `https://${appId}.api-${region}.cometchat.io/v3`;
}

function restHeaders(onBehalfOf: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.COMETCHAT_API_KEY ?? '',
    appid: process.env.COMETCHAT_APP_ID ?? '',
    onBehalfOf,
  };
}

interface SendOptions {
  /** Who the message is from. */
  as: string;
  text: string;
  /** Set to make this a threaded reply. */
  parentMessageId?: number;
}

/**
 * Send a message to the Strategy group over REST.
 *
 * A threaded reply goes to its own endpoint — `POST /messages/{parentId}/thread`.
 * Posting to `/messages` with `parentMessageId` in the body does NOT thread it:
 * the API answers 200 and returns a message with `parentId: null`, i.e. a
 * top-level message. That failure is silent, so the reply is verified below.
 *
 * `parentMessageId` is sent as a string — the API expects it that way.
 *
 * @returns the new message's id, so tests can root assertions at it.
 */
export async function sendGroupMessage({ as, text, parentMessageId }: SendOptions): Promise<number> {
  const body: Record<string, unknown> = {
    receiver: STRATEGY_GROUP,
    receiverType: 'group',
    category: 'message',
    type: 'text',
    data: { text },
  };
  if (parentMessageId) body.parentMessageId = String(parentMessageId);

  const url = parentMessageId
    ? `${restBase()}/messages/${String(parentMessageId)}/thread`
    : `${restBase()}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: restHeaders(as),
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    data?: { id?: string | number; parentId?: string | number };
  };
  const id = Number(payload.data?.id);
  if (!id) throw new Error(`Failed to send message as ${as}: ${JSON.stringify(payload)}`);

  // Guard the silent failure above: a reply that did not thread would make the
  // auto-subscribe tests fail for a reason that has nothing to do with them.
  if (parentMessageId && Number(payload.data?.parentId) !== parentMessageId) {
    throw new Error(
      `Reply ${String(id)} was not threaded under ${String(parentMessageId)} ` +
        `(parentId came back as ${String(payload.data?.parentId)}).`
    );
  }

  return id;
}

interface EditOptions {
  /** Who edits the message (must be its original author). */
  as: string;
  messageId: number;
  /** The replacement text. A mention token here is parsed exactly as on send. */
  text: string;
}

/**
 * Edit a group message over REST, as `as` (its author).
 *
 * The edit endpoint is `PUT /messages/{id}`. Mirrors the send contract — a mention
 * token dropped into the new text is parsed server-side into a real mention, which
 * is how "someone edits their reply to @-mention me" becomes a genuine
 * `onMessageEdited` event carrying the mention rather than a simulated one.
 */
export async function editGroupMessage({ as, messageId, text }: EditOptions): Promise<void> {
  const response = await fetch(`${restBase()}/messages/${String(messageId)}`, {
    method: 'PUT',
    headers: restHeaders(as),
    body: JSON.stringify({ category: 'message', type: 'text', data: { text } }),
  });

  const payload = (await response.json()) as { data?: { id?: string | number } };
  if (!payload.data?.id) {
    throw new Error(
      `Failed to edit message ${String(messageId)} as ${as}: ${JSON.stringify(payload)}`
    );
  }
}

/**
 * An explicit @-mention of one user, as it appears on the wire.
 *
 * This is the only form that subscribes the mentioned user to a thread; the
 * composer's mention picker produces the same token.
 */
export function mentionToken(uid: string): string {
  return `<@uid:${uid}>`;
}

// ─── Wire capture ────────────────────────────────────────────────────────────

export interface SubscriptionCall {
  /** POST = follow, DELETE = unfollow. */
  method: string;
  /** The message id the subscription is rooted at. */
  messageId: string;
}

export interface SubscriptionCapture {
  calls: SubscriptionCall[];
  stop: () => void;
}

const SUBSCRIPTION_URL = /\/messages\/(\d+)\/thread\/subscription/;

/**
 * Record every subscribe/unsubscribe the page issues.
 *
 * The only way to prove two rules: that a subscribe from a reply is rooted at
 * the *parent* (a row rooted at a reply would be unopenable in a thread list),
 * and that a rapid double-tap produces exactly one write.
 */
export function captureSubscriptionCalls(page: Page): SubscriptionCapture {
  const calls: SubscriptionCall[] = [];
  const onRequest = (request: Request) => {
    const match = SUBSCRIPTION_URL.exec(request.url());
    if (match) calls.push({ method: request.method(), messageId: match[1] });
  };
  page.on('request', onRequest);
  return {
    calls,
    stop: () => {
      page.off('request', onRequest);
    },
  };
}

/** Make every subscribe/unsubscribe fail, as an offline device would. */
export async function failSubscriptionWrites(page: Page): Promise<void> {
  await page.route(SUBSCRIPTION_URL, route => route.abort('failed'));
}

export async function restoreSubscriptionWrites(page: Page): Promise<void> {
  await page.unroute(SUBSCRIPTION_URL);
}

// ─── UI ──────────────────────────────────────────────────────────────────────

/** Open a message bubble's action sheet, given a locator for its wrapper. */
export async function openActionSheet(page: Page, bubble: ReturnType<Page['locator']>) {
  await bubble.locator('.cometchat-message-bubble__body').first().hover();
  await page.waitForTimeout(400);

  const moreButton = bubble.locator('button[aria-label*="More" i]').first();
  await expect(moreButton).toBeVisible({ timeout: 5_000 });
  await moreButton.click();
  await page.waitForTimeout(400);
}

export async function closeActionSheet(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

/** The bubble in the main message list containing the given text. */
export function bubbleWithText(page: Page, text: string) {
  return page
    .locator('.cometchat-message-list .cometchat-message-bubble__wrapper')
    .filter({ hasText: text })
    .first();
}

/** The bubble inside the open thread panel containing the given text. */
export function threadBubbleWithText(page: Page, text: string) {
  return page
    .locator('.cometchat-thread-panel__messages .cometchat-message-bubble__wrapper')
    .filter({ hasText: text })
    .first();
}

export function threadBell(page: Page) {
  return page.locator('.cometchat-thread-header__subscription-button').first();
}

/** Whether the header bell currently shows the followed (plain bell) state. */
export async function isBellFollowed(page: Page): Promise<boolean> {
  const on = page.locator('.cometchat-thread-header__subscription-icon--on');
  return (await on.count()) > 0;
}

/** Open the thread for a bubble via its "Reply in thread" option. */
export async function openThreadFor(page: Page, bubble: ReturnType<Page['locator']>) {
  await openActionSheet(page, bubble);
  await page.locator('[role="menuitem"]:has-text("Reply in thread")').first().click();
  await expect(page.locator('.cometchat-thread-panel').first()).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1000);
}

/** Close the thread panel if it is open. */
export async function closeThread(page: Page) {
  const close = page.locator('.cometchat-thread-header__close-button').first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.waitForTimeout(600);
  }
}

/**
 * Unsubscribe from the currently-open thread by clicking the (followed) bell.
 *
 * The setup helper for every "after a manual unsubscribe" case: with the author
 * auto-subscribed by default, a fresh thread of your own starts followed, so
 * tests that need an unsubscribed starting point unfollow through the real UI
 * (a genuine DELETE the server records), then proceed.
 *
 * Precondition: the thread panel is open.
 */
export async function unsubscribeViaBell(page: Page): Promise<void> {
  await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);
  await threadBell(page).click();
  await expect(page.locator('.cometchat-toast__text')).toHaveText(UNSUBSCRIBED_TOAST, {
    timeout: 5_000,
  });
  await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(false);
}

/** Send a reply from the thread composer. */
export async function sendThreadReply(page: Page, text: string) {
  const composer = page.locator('.cometchat-thread-panel .cometchat-message-composer').first();
  await expect(composer).toBeVisible({ timeout: 5_000 });
  const input = composer.locator('[contenteditable="true"]').first();
  await input.click();
  await page.keyboard.type(text);
  await page.waitForTimeout(300);
  await composer
    .locator('[class*="send-button"], button[aria-label*="Send" i]')
    .first()
    .click();
  await page.waitForTimeout(2500);
}

// ─── Non-text sends (auto-subscribe by message type) ──────────────────────────

/**
 * The most recent main-list bubble that contains `innerSelector`.
 *
 * For messages with no searchable text of their own (a sticker, a bare image) —
 * locate the wrapper by the bubble type inside it instead.
 */
export function bubbleContaining(page: Page, innerSelector: string) {
  return page
    .locator('.cometchat-message-list .cometchat-message-bubble__wrapper')
    .filter({ has: page.locator(innerSelector) })
    .last();
}

/** Send the first available sticker from the main composer's sticker keyboard. */
export async function sendSticker(page: Page): Promise<void> {
  const stickerBtn = page.locator('.cometchat-message-composer__sticker-button').first();
  await expect(stickerBtn).toBeVisible({ timeout: 5_000 });
  await stickerBtn.click();
  await page.waitForTimeout(1500);

  const keyboard = page
    .locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]')
    .first();
  await expect(keyboard).toBeVisible({ timeout: 5_000 });

  const firstSticker = keyboard.locator('.cometchat-stickers-keyboard__sticker-item').first();
  await expect(firstSticker).toBeVisible({ timeout: 5_000 });
  await firstSticker.click();
  await page.waitForTimeout(3000);
}

/**
 * Send an image from the composer's attachment menu.
 *
 * `filePath` is resolved by the caller (the fixtures live under `e2e/fixtures`).
 * The composer stages the file, waits for the upload, then sends the batch.
 */
export async function sendImage(page: Page, filePath: string): Promise<void> {
  const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
  await expect(attachBtn).toBeVisible({ timeout: 5_000 });
  await attachBtn.click();
  await page.waitForTimeout(1000);

  const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
  await expect(optionsList).toBeVisible({ timeout: 5_000 });

  const option = optionsList
    .locator('.cometchat-message-composer__attachment-option')
    .filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    })
    .first();
  await expect(option).toBeVisible({ timeout: 3_000 });

  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
  await option.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);

  const tray = page.locator('.cometchat-message-composer__tray').first();
  await expect(tray).toBeVisible({ timeout: 10_000 });
  await expect(tray.locator('.cometchat-message-composer__tray-progress')).toHaveCount(0, {
    timeout: 60_000,
  });

  const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
  await expect(sendBtn).toBeVisible({ timeout: 5_000 });
  await sendBtn.click();
  await expect(tray).not.toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
}

/**
 * Create a poll from the composer's attachment menu.
 *
 * The poll is created server-side (CometChat.callExtension) and arrives back over
 * the socket as a custom message — the *received* display path, not the optimistic
 * send path. That is exactly the choke point a self-authored poll's auto-subscribe
 * must fire on. Returns the unique question text so the caller can locate the bubble.
 */
export async function createPoll(page: Page, label: string): Promise<string> {
  const question = `${label} [${Date.now()}]`;

  const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
  await expect(attachBtn).toBeVisible({ timeout: 5_000 });
  await attachBtn.click();
  await page.waitForTimeout(1000);

  const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
  await expect(optionsList).toBeVisible({ timeout: 5_000 });

  const pollOption = optionsList
    .locator('.cometchat-message-composer__attachment-option')
    .filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Poll")'),
    })
    .first();
  await expect(pollOption).toBeVisible({ timeout: 3_000 });
  await pollOption.click();
  await page.waitForTimeout(1000);

  const pollModal = page.locator('.cometchat-create-poll').first();
  await expect(pollModal).toBeVisible({ timeout: 5_000 });

  await pollModal.locator('.cometchat-create-poll__question-input').first().fill(question);
  const optionInputs = pollModal.locator('.cometchat-create-poll__option-input');
  await optionInputs.nth(0).fill('Option A');
  await optionInputs.nth(1).fill('Option B');

  await pollModal.locator('.cometchat-create-poll__create-button').first().click();
  await expect(pollModal).not.toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(3000);

  return question;
}

// ─── Editing a thread reply through the UI (same-device `ui:compose/edit`) ─────

interface ThreadReplyEditOptions {
  /** The reply currently in the thread panel to edit (located by its text). */
  replyText: string;
  /** Plain text to append to the reply. */
  appendText?: string;
  /**
   * Display name to @-mention via the composer's picker. Use PRIMARY_NAME to
   * mention *yourself* — the only mention that re-subscribes the editor.
   */
  mentionName?: string;
}

/**
 * Edit one of my own replies from inside the open thread panel.
 *
 * Goes through the real edit affordance (action sheet → Edit → thread composer),
 * so the change is published as `ui:compose/edit` — the same-device edit path,
 * distinct from the socket `message/edited` that another user's edit produces.
 *
 * Precondition: the thread panel is open and the reply is visible in it.
 */
export async function editThreadReply(
  page: Page,
  { replyText, appendText, mentionName }: ThreadReplyEditOptions
): Promise<void> {
  await openActionSheet(page, threadBubbleWithText(page, replyText));
  await page.locator('[role="menuitem"]:has-text("Edit")').first().click();

  const composer = page.locator('.cometchat-thread-panel .cometchat-message-composer').first();
  await expect(composer.locator('.cometchat-message-composer__edit-preview')).toBeVisible({
    timeout: 5_000,
  });

  const input = composer.locator('[contenteditable="true"]').first();
  await input.click();
  await page.keyboard.press('End');

  if (appendText) {
    await page.keyboard.type(` ${appendText}`);
  }

  if (mentionName) {
    // Type "@" then filter by the first name; click the matching suggestion so a
    // real mention chip (not raw text) is inserted and serialized.
    await page.keyboard.type(' @');
    const dropdown = page.locator('.cometchat-message-composer__mentions-list').first();
    await expect(dropdown).toBeVisible({ timeout: 5_000 });
    await page.keyboard.type(mentionName.split(' ')[0]);
    await page.waitForTimeout(500);
    const item = dropdown
      .locator('.cometchat-group-members__item')
      .filter({ hasText: mentionName })
      .first();
    await expect(item).toBeVisible({ timeout: 5_000 });
    await item.click();
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(200);
  await composer
    .locator('[class*="send-button"], button[aria-label*="Send" i]')
    .first()
    .click();
  await page.waitForTimeout(2500);
}
