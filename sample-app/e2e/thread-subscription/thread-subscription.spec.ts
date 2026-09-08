import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

// ESM has no __dirname; derive it from the module URL (matches the other specs).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  FAILED_TOAST,
  SUBSCRIBE_OPTION,
  PRIMARY_NAME,
  PRIMARY_UID,
  SECONDARY_UID,
  SUBSCRIBED_TOAST,
  UNSUBSCRIBE_OPTION,
  UNSUBSCRIBED_TOAST,
  bubbleContaining,
  bubbleWithText,
  captureSubscriptionCalls,
  closeActionSheet,
  closeThread,
  createPoll,
  editGroupMessage,
  editThreadReply,
  failSubscriptionWrites,
  isBellFollowed,
  mentionToken,
  openActionSheet,
  openThreadFor,
  restoreSubscriptionWrites,
  sendGroupMessage,
  sendImage,
  sendSticker,
  sendThreadReply,
  threadBell,
  threadBubbleWithText,
  unsubscribeViaBell,
} from '../helpers/threads';

/**
 * E2E — Thread subscription (React)
 *
 * Two surfaces over one piece of state: the `threadSubscription` message option
 * and the thread header's bell. They must always agree, and the state must
 * survive a reload.
 *
 * Baseline behaviour these tests assume: **the author of a message is subscribed
 * to its thread by default.** So a parent YOU sent starts *followed* (the option
 * reads "Unsubscribe", the bell is on); a parent SOMEONE ELSE sent starts
 * un-followed for you until you reply or are @-mentioned. That default is why so
 * many cases here unsubscribe first before exercising a re-subscribe rule.
 *
 * Runs against the Strategy group (the mutable one). Each block seeds its own
 * parent message over REST so tests never depend on each other's leftovers.
 */
test.describe('Thread subscription', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /** Seed a fresh parent message I sent — followed by default (author auto-subscribe). */
  async function seedParent(label: string): Promise<{ id: number; text: string }> {
    const text = `${label} [${Date.now()}]`;
    const id = await sendGroupMessage({ as: PRIMARY_UID, text });
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
    return { id, text };
  }

  /** Seed a fresh parent SOMEONE ELSE sent — un-followed by default for me. */
  async function seedIncomingParent(label: string): Promise<{ id: number; text: string }> {
    const text = `${label} [${Date.now()}]`;
    const id = await sendGroupMessage({ as: SECONDARY_UID, text });
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
    return { id, text };
  }

  // ==================== Option presence ====================

  test('offered on a message with zero replies (follows by default, so reads "Unsubscribe")', async () => {
    // Your own message subscribes you to the thread it may grow, before anyone
    // answers — so the option is present and reads "Unsubscribe".
    const { text } = await seedParent('Zero-reply parent');

    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
  });

  test('offered on a thread parent, alongside "Reply in thread"', async () => {
    const { id, text } = await seedParent('Parent with replies');
    await sendGroupMessage({ as: SECONDARY_UID, text: 'a reply', parentMessageId: id });
    await page.waitForTimeout(2000);

    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await expect(page.locator('[role="menuitem"]:has-text("Reply in thread")')).toBeVisible();
    await closeActionSheet(page);
  });

  test('offered on a reply, and roots the unsubscribe at the PARENT', async () => {
    // A subscription rooted at a reply id would create a /threads row that can
    // never be opened, so the reply's own id must never reach the wire — true
    // for unsubscribe just as for subscribe.
    const { id: parentId, text: parentText } = await seedParent('Root for reply-sheet');
    const replyText = `Reply body [${Date.now()}]`;
    const replyId = await sendGroupMessage({
      as: SECONDARY_UID,
      text: replyText,
      parentMessageId: parentId,
    });
    await page.waitForTimeout(2000);

    await openThreadFor(page, bubbleWithText(page, parentText));

    const capture = captureSubscriptionCalls(page);
    // Parent is mine, so the reply sheet reads "Unsubscribe"; acting on it must
    // still target the parent id.
    await openActionSheet(page, threadBubbleWithText(page, replyText));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`).first().click();
    await page.waitForTimeout(2000);
    capture.stop();

    expect(capture.calls.length).toBeGreaterThan(0);
    expect(capture.calls[0].method).toBe('DELETE');
    expect(capture.calls[0].messageId).toBe(String(parentId));
    expect(capture.calls.map(c => c.messageId)).not.toContain(String(replyId));

    await closeThread(page);
  });

  test('an unfollowed parent makes the reply sheet read "Subscribe to thread"', async () => {
    // Both entry points resolve to the same thread id, so unfollowing via one
    // must be what the other reads back.
    const { id: parentId, text: parentText } = await seedParent('Root for shared state');
    const replyText = `Shared-state reply [${Date.now()}]`;
    await sendGroupMessage({ as: SECONDARY_UID, text: replyText, parentMessageId: parentId });
    await page.waitForTimeout(2000);

    // Parent starts followed (mine) — unfollow from its own sheet in the main list.
    await openActionSheet(page, bubbleWithText(page, parentText));
    await page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`).first().click();
    await page.waitForTimeout(2000);

    await openThreadFor(page, bubbleWithText(page, parentText));
    await openActionSheet(page, threadBubbleWithText(page, replyText));
    await expect(page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
    await closeThread(page);
  });

  // ==================== Thread header bell ====================

  test('bell is present and followed on a fresh zero-reply thread (author auto-subscribed)', async () => {
    const { text } = await seedParent('Bell default state');
    await openThreadFor(page, bubbleWithText(page, text));

    await expect(threadBell(page)).toBeVisible();
    expect(await isBellFollowed(page)).toBe(true);
    await expect(threadBell(page)).toHaveAttribute('aria-label', UNSUBSCRIBE_OPTION);

    await closeThread(page);
  });

  test('bell exposes an accessible name and a matching tooltip', async () => {
    const { text } = await seedParent('Bell a11y');
    await openThreadFor(page, bubbleWithText(page, text));

    const bell = threadBell(page);
    // Starts followed (mine), so both the accessible name and tooltip read "Unsubscribe".
    await expect(bell).toHaveAttribute('aria-label', UNSUBSCRIBE_OPTION);

    await bell.hover();
    const tooltip = page.locator('[role="tooltip"]').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    // WCAG 2.5.3 — the visible label and the accessible name must not diverge.
    await expect(tooltip).toHaveText(UNSUBSCRIBE_OPTION);

    await bell.click();
    await page.waitForTimeout(1500);
    await expect(bell).toHaveAttribute('aria-label', SUBSCRIBE_OPTION);

    await closeThread(page);
  });

  // ==================== Toggling, and the two surfaces agreeing ====================

  test('follow and unfollow from the bell, reflected in replies and in the main list', async () => {
    const { text: parentText } = await seedParent('Bell round trip');
    const replyText = `Round-trip reply [${Date.now()}]`;

    await openThreadFor(page, bubbleWithText(page, parentText));
    // Send a reply so there is a reply bubble to read the shared state from; the
    // bell is already followed (author default), reply or not.
    await sendThreadReply(page, replyText);
    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);

    // Unfollow from the bell...
    await threadBell(page).click();
    await expect(page.locator('.cometchat-toast__text')).toHaveText(UNSUBSCRIBED_TOAST, {
      timeout: 5_000,
    });
    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(false);

    // ...and the reply's own sheet agrees.
    await openActionSheet(page, threadBubbleWithText(page, replyText));
    await expect(page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);

    // Follow again from the reply's sheet, and the bell flips back.
    await openActionSheet(page, threadBubbleWithText(page, replyText));
    await page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`).first().click();
    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);

    // ...as does the parent in the main message list.
    await closeThread(page);
    await openActionSheet(page, bubbleWithText(page, parentText));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
  });

  test('subscribing from the main-list option flips the OPEN thread bell in realtime', async () => {
    // The main list stays mounted beside the thread panel, so acting on the
    // parent's option there must reach the open bell over the bus — no refetch.
    const { text } = await seedIncomingParent('Option to bell');
    await openThreadFor(page, bubbleWithText(page, text));
    expect(await isBellFollowed(page)).toBe(false);

    await openActionSheet(page, bubbleWithText(page, text));
    await page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`).first().click();

    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);
    await closeThread(page);
  });

  test('follow and unfollow each show their confirmation toast', async () => {
    const { text } = await seedParent('Toast both ways');

    // Starts followed (mine) → unfollowing shows the unsubscribed toast.
    await openActionSheet(page, bubbleWithText(page, text));
    await page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`).first().click();
    await expect(page.locator('.cometchat-toast__text')).toHaveText(UNSUBSCRIBED_TOAST, {
      timeout: 5_000,
    });
    await page.waitForTimeout(2500);

    // ...then following again shows the subscribed toast.
    await openActionSheet(page, bubbleWithText(page, text));
    await page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`).first().click();
    await expect(page.locator('.cometchat-toast__text')).toHaveText(SUBSCRIBED_TOAST, {
      timeout: 5_000,
    });
  });

  test('a manual unsubscribe survives a reload', async () => {
    const { text } = await seedParent('Survives reload');

    // Starts followed; unsubscribe, then prove the deliberate choice is re-read
    // from the server after a reload — not the author-default followed state.
    await openActionSheet(page, bubbleWithText(page, text));
    await page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`).first().click();
    await page.waitForTimeout(2500);

    await page.reload();
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });

    // Re-read from the server, not from anything we held in memory.
    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
  });

  // ==================== Write failure and rapid taps ====================

  test('a failed write reverts the control and shows the failure toast', async () => {
    const { text } = await seedParent('Write fails');
    await openThreadFor(page, bubbleWithText(page, text));
    // Followed by default; the failing write is the unsubscribe attempt.
    expect(await isBellFollowed(page)).toBe(true);

    await failSubscriptionWrites(page);
    await threadBell(page).click();

    await expect(page.locator('.cometchat-toast__text')).toHaveText(FAILED_TOAST, {
      timeout: 5_000,
    });
    // Optimism is reverted — no queue, no retry — so it stays followed.
    await expect.poll(async () => isBellFollowed(page), { timeout: 5_000 }).toBe(true);

    await restoreSubscriptionWrites(page);
    await closeThread(page);
  });

  test('a double tap inside the debounce window produces one write and one net flip', async () => {
    const { text } = await seedParent('Double tap');
    await openThreadFor(page, bubbleWithText(page, text));
    // Followed by default, so the first tap unsubscribes; the second is swallowed.
    expect(await isBellFollowed(page)).toBe(true);

    const capture = captureSubscriptionCalls(page);
    const bell = threadBell(page);
    await bell.click();
    await bell.click(); // well inside the 400 ms window
    await page.waitForTimeout(2500);
    capture.stop();

    expect(capture.calls).toHaveLength(1);
    expect(capture.calls[0].method).toBe('DELETE');
    expect(await isBellFollowed(page)).toBe(false);

    await closeThread(page);
  });

  // ==================== Replying subscribes you (Case 4) ====================

  test('replying re-subscribes you on your own thread after a manual unsubscribe', async () => {
    // Outgoing parent: followed by default, so unsubscribe first — then a reply
    // of your own is the only thing that can flip it back.
    const { text } = await seedParent('Reply subscribes: my parent');
    await openThreadFor(page, bubbleWithText(page, text));
    await unsubscribeViaBell(page);

    await sendThreadReply(page, `My reply [${Date.now()}]`);

    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);
    await closeThread(page);
  });

  test("replying subscribes you on someone else's thread", async () => {
    // Incoming parent: un-followed to start, so no unsubscribe needed.
    const { text } = await seedIncomingParent('Reply subscribes: their parent');
    await openThreadFor(page, bubbleWithText(page, text));
    expect(await isBellFollowed(page)).toBe(false);

    const replyText = `My reply [${Date.now()}]`;
    await sendThreadReply(page, replyText);

    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);

    // The triggering reply's OWN option reflects the subscribe, not just the bell.
    await openActionSheet(page, threadBubbleWithText(page, replyText));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);

    await closeThread(page);
  });

  // ==================== A normal reply must NOT flip a deliberate unsubscribe ====================

  test("a normal reply does not re-subscribe you on your own thread after unsubscribing", async () => {
    // The old behaviour subscribed you when someone replied to a message you
    // sent. That must no longer happen: an un-followed state is now a deliberate
    // unsubscribe, and a normal reply must respect it.
    const { id, text } = await seedParent('No flip: my parent');
    await openThreadFor(page, bubbleWithText(page, text));
    await unsubscribeViaBell(page);

    const replyText = `Their reply [${Date.now()}]`;
    await sendGroupMessage({ as: SECONDARY_UID, text: replyText, parentMessageId: id });
    // Wait until the reply is actually processed (the point a wrong auto-subscribe
    // would fire), then assert the unsubscribe held.
    await expect(threadBubbleWithText(page, replyText)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    expect(await isBellFollowed(page)).toBe(false);

    await closeThread(page);
  });

  test("a normal reply does not subscribe you on someone else's thread", async () => {
    const { id, text } = await seedIncomingParent('No flip: their parent');
    await openThreadFor(page, bubbleWithText(page, text));
    expect(await isBellFollowed(page)).toBe(false);

    const replyText = `Another reply [${Date.now()}]`;
    await sendGroupMessage({ as: SECONDARY_UID, text: replyText, parentMessageId: id });
    await expect(threadBubbleWithText(page, replyText)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    expect(await isBellFollowed(page)).toBe(false);

    await closeThread(page);
  });

  // ==================== A mention subscribes you unconditionally (Case 3) ====================

  test("being @-mentioned subscribes you on someone else's thread, without replying or owning the parent", async () => {
    // Parent authored by the OTHER user and we never reply — the mention is the
    // only thing that can subscribe us.
    const { id, text } = await seedIncomingParent('Mention: their parent');
    await openThreadFor(page, bubbleWithText(page, text));
    expect(await isBellFollowed(page)).toBe(false);

    // The mention renders as a chip; keep a plain-text marker to locate the bubble.
    await sendGroupMessage({
      as: SECONDARY_UID,
      text: `${mentionToken(PRIMARY_UID)} take a look`,
      parentMessageId: id,
    });

    await expect.poll(async () => isBellFollowed(page), { timeout: 15_000 }).toBe(true);

    // The triggering mention reply's OWN option reflects it too, not just the bell.
    await openActionSheet(page, threadBubbleWithText(page, 'take a look'));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);

    await closeThread(page);
  });

  test('a mention re-subscribes you on your own thread even after unsubscribing', async () => {
    // The contrast with the "normal reply" cases: a mention is unconditional, so
    // it overrides a deliberate unsubscribe. Own parent → unsubscribe first.
    const { id, text } = await seedParent('Mention: my parent');
    await openThreadFor(page, bubbleWithText(page, text));
    await unsubscribeViaBell(page);

    await sendGroupMessage({
      as: SECONDARY_UID,
      text: `${mentionToken(PRIMARY_UID)} thoughts?`,
      parentMessageId: id,
    });

    await expect.poll(async () => isBellFollowed(page), { timeout: 15_000 }).toBe(true);
    await closeThread(page);
  });

  // ==================== Realtime reply rendering ====================

  test("a realtime reply inherits the followed parent's state (its own option reads Unsubscribe)", async () => {
    // A socket-delivered reply carries no subscription flag of its own. In a
    // followed thread the list must stamp it from the parent, so the freshly
    // arrived reply's option reads "Unsubscribe", not "Subscribe".
    const { id, text } = await seedParent('Realtime inherit');
    await openThreadFor(page, bubbleWithText(page, text));
    expect(await isBellFollowed(page)).toBe(true); // followed by default (mine)

    const replyText = `Inherited reply [${Date.now()}]`;
    await sendGroupMessage({ as: SECONDARY_UID, text: replyText, parentMessageId: id });
    await expect(threadBubbleWithText(page, replyText)).toBeVisible({ timeout: 15_000 });

    await openActionSheet(page, threadBubbleWithText(page, replyText));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
    await closeThread(page);
  });

  // ==================== Editing a reply into (or out of) a mention ====================
  //
  // Two edit paths converge on the same rule — an edit that *mentions me*
  // subscribes me; own authorship alone does not re-subscribe on edit:
  //   • another user's edit arrives as a socket `message/edited`
  //   • my own edit is published same-device as `ui:compose/edit`

  test('someone editing their reply to @-mention me subscribes me (message/edited)', async () => {
    // Their parent, unfollowed to start. A plain reply from them changes nothing;
    // the same reply edited to add a mention of me must subscribe me.
    const { id, text } = await seedIncomingParent('Edit-mention: their parent');
    await openThreadFor(page, bubbleWithText(page, text));
    expect(await isBellFollowed(page)).toBe(false);

    const replyText = `Editable reply [${Date.now()}]`;
    const replyId = await sendGroupMessage({
      as: SECONDARY_UID,
      text: replyText,
      parentMessageId: id,
    });
    await expect(threadBubbleWithText(page, replyText)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    expect(await isBellFollowed(page)).toBe(false); // a normal reply from them did nothing

    await editGroupMessage({
      as: SECONDARY_UID,
      messageId: replyId,
      text: `${mentionToken(PRIMARY_UID)} ${replyText}`,
    });

    await expect.poll(async () => isBellFollowed(page), { timeout: 15_000 }).toBe(true);
    await closeThread(page);
  });

  test('editing my own reply to @-mention myself re-subscribes me (ui:compose/edit)', async () => {
    // Own parent → followed by default. Sending a reply keeps me followed, so
    // unsubscribe AFTER the reply exists to reach an unfollowed thread that still
    // holds my own editable reply. Editing it to add a self-mention re-subscribes.
    const { text } = await seedParent('Edit-mention: my own reply');
    await openThreadFor(page, bubbleWithText(page, text));

    const replyText = `My editable reply [${Date.now()}]`;
    await sendThreadReply(page, replyText);
    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);

    await unsubscribeViaBell(page);

    await editThreadReply(page, { replyText, mentionName: PRIMARY_NAME });

    await expect.poll(async () => isBellFollowed(page), { timeout: 15_000 }).toBe(true);
    await closeThread(page);
  });

  test('editing my own reply without a mention does not re-subscribe me', async () => {
    // The contrast with the case above: own authorship is not enough on an edit —
    // only a mention re-subscribes, so a text-only edit must respect the unsubscribe.
    const { text } = await seedParent('Edit-no-mention: my own reply');
    await openThreadFor(page, bubbleWithText(page, text));

    const replyText = `My plain reply [${Date.now()}]`;
    await sendThreadReply(page, replyText);
    await expect.poll(async () => isBellFollowed(page), { timeout: 10_000 }).toBe(true);

    await unsubscribeViaBell(page);

    await editThreadReply(page, { replyText, appendText: 'edited' });

    await page.waitForTimeout(1500);
    expect(await isBellFollowed(page)).toBe(false); // the deliberate unsubscribe holds
    await closeThread(page);
  });

  // ==================== Auto-subscribe holds for every message type ====================
  //
  // Case 2 — the author is subscribed to their own message's thread by default —
  // is type-agnostic. One test per non-text type I can send from the real UI,
  // each asserting the parent's own option reads "Unsubscribe" with the thread
  // panel never opened (the object is stamped subscribed at send time). Stickers
  // and images travel the `ui:message/sent` path; a poll is created server-side
  // and returns over the socket as a custom message (the *received* path).

  test('a sticker I send follows its own thread by default (Case 2)', async () => {
    await sendSticker(page);
    const bubble = bubbleContaining(page, '.cometchat-sticker-bubble, [class*="sticker-bubble"]');
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    await openActionSheet(page, bubble);
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
  });

  test('an image I send follows its own thread by default (Case 2)', async () => {
    await sendImage(page, path.resolve(__dirname, '../fixtures/test-image.png'));
    const bubble = bubbleContaining(page, '.cometchat-images-bubble, [class*="image-bubble"]');
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    await openActionSheet(page, bubble);
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
  });

  test('a poll I create follows its own thread by default (Case 2 via custom-received)', async () => {
    const question = await createPoll(page, 'Auto-subscribe poll');
    const bubble = bubbleWithText(page, question);
    await expect(bubble).toBeVisible({ timeout: 20_000 });

    await openActionSheet(page, bubble);
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);
  });

  // ==================== Mirrors to the main list with the thread panel CLOSED ====================
  //
  // Every group bubble tracks its own subscription state live (the bubble renderer
  // mounts the state hook), so an incoming reply that subscribes me flips the
  // PARENT's own option in the main list without the thread ever being opened.
  // The thread panel is never opened in these two.

  test("an incoming @-mention flips the parent's own option with the panel closed", async () => {
    const { id, text } = await seedIncomingParent('Panel-closed mention');

    // Starts unfollowed — read from the parent's own option, panel never opened.
    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);

    await sendGroupMessage({
      as: SECONDARY_UID,
      text: `${mentionToken(PRIMARY_UID)} heads up`,
      parentMessageId: id,
    });
    await page.waitForTimeout(4000); // let the reply arrive and the mirror land

    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible({
      timeout: 5_000,
    });
    await closeActionSheet(page);
  });

  test("an edit that adds a mention flips the parent's own option with the panel closed", async () => {
    const { id, text } = await seedIncomingParent('Panel-closed edit-mention');

    const replyText = `Editable ping [${Date.now()}]`;
    const replyId = await sendGroupMessage({
      as: SECONDARY_UID,
      text: replyText,
      parentMessageId: id,
    });
    await page.waitForTimeout(2000);

    // A normal reply from them left the parent unfollowed.
    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`)).toBeVisible();
    await closeActionSheet(page);

    await editGroupMessage({
      as: SECONDARY_UID,
      messageId: replyId,
      text: `${mentionToken(PRIMARY_UID)} ${replyText}`,
    });
    await page.waitForTimeout(4000);

    await openActionSheet(page, bubbleWithText(page, text));
    await expect(page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`)).toBeVisible({
      timeout: 5_000,
    });
    await closeActionSheet(page);
  });

  // ==================== Scope ====================

  test('offered in a 1:1 chat too', async () => {
    // Thread subscription now works in 1:1 as well as groups — the option must
    // appear on the message action sheet on both surfaces.
    const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
    await usersTab.click();
    await page.waitForSelector('.cometchat-users__item', { timeout: 30_000 });
    await page.locator('.cometchat-users__item').filter({ hasText: 'Bob' }).first().click();
    await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
    await page.waitForTimeout(1000);

    const bubble = page
      .locator('.cometchat-message-list .cometchat-message-bubble__wrapper')
      .last();
    await openActionSheet(page, bubble);

    // Either label is acceptable — the option is present; its wording depends on
    // whether this message's thread is already followed.
    const subscribe = page.locator(`[role="menuitem"]:has-text("${SUBSCRIBE_OPTION}")`);
    const unsubscribe = page.locator(`[role="menuitem"]:has-text("${UNSUBSCRIBE_OPTION}")`);
    await expect(subscribe.or(unsubscribe).first()).toBeVisible();
    await closeActionSheet(page);
  });
});
