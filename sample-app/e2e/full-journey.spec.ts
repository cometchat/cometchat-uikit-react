import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, Browser, Locator, Page } from './helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER, SECONDARY_USER, STRATEGY_GROUP } from './helpers';
import { openStrategyChatFromConversations, selectGroupByName, waitForChatOpen } from './helpers/navigation';
import { expectSendAccepted, MAIN_LIST } from './helpers/send';
import {
  createPoll,
  openActionSheet,
  openThreadFor,
  sendImage,
  sendSticker,
  sendThreadReply,
  threadBubbleWithText,
  waitForBubbleSettled,
} from './helpers/threads';
import { adminHeaders, conversationItem, openChatsTab, restBase, sendMessageToGroup } from './helpers/pinSave';
import { createThrowawayGroup, ThrowawayGroup } from './helpers/fixtures';
import { visibleWithin } from './helpers/wait';

/**
 * Full journey — one continuous session through the whole sample app.
 *
 * Alice logs in once and the steps build on each other (the message sent in 2.1
 * is reacted to, edited, quoted, threaded and inspected later), so steps can't
 * run on their own and none is tagged @smoke. A failing step stops the rest.
 *
 * Data: writes go to the Strategy group or to fixtures created here — a
 * throwaway group, a throwaway contact user for every 1:1 step, and three
 * E2E_Test_* groups created through the UI — all removed in afterAll (and swept
 * by `npm run e2e:cleanup` if a run dies). Bob's 1:1 chat and Design Team are
 * read-only fixtures for other suites. Two-user steps open a second browser
 * context for the other user.
 */

// ESM has no __dirname; derive it from the module URL (matches the other specs).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, 'fixtures');

const RUN_ID = Date.now().toString(36);

// Chromium's fake camera/microphone stand in for real devices: calls and voice notes
// run headless (same setup as calls/incoming-call.spec.ts).
const MEDIA_ARGS = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
test.use({ launchOptions: { args: MEDIA_ARGS }, permissions: ['microphone', 'camera'] });

/** Throwaway 1:1 partner, so no 1:1 step writes to a shared user's chat. */
const CONTACT = { uid: `e2e-user-journey-${RUN_ID}`, name: `Journey Contact ${RUN_ID}` };
const ALICE_NAME = 'Alice Johnson';
const BOB_NAME = 'Bob Smith';
/** Throwaway group (REST) for the destructive and admin steps. */
const GROUP_NAME = `E2E_Test_Journey_${RUN_ID}`;
/** Groups created through the UI in 17.1 — the E2E_Test_ prefix lets the cleanup script find them. */
const UI_GROUPS = [
  { type: 'Public', name: `E2E_Test_Public_${RUN_ID}`, password: '' },
  { type: 'Private', name: `E2E_Test_Private_${RUN_ID}`, password: '' },
  { type: 'Password', name: `E2E_Test_Password_${RUN_ID}`, password: 'journey123' },
];

/** Every text the journey sends carries RUN_ID, so a step only ever matches its own message. */
const TEXT = {
  m1: `Journey message [${RUN_ID}]`,
  m1Edited: `Journey message edited [${RUN_ID}]`,
  toDelete: `Journey delete me [${RUN_ID}]`,
  quote: `Journey quoted reply [${RUN_ID}]`,
  thread1: `Journey thread reply one [${RUN_ID}]`,
  thread2: `Journey thread reply two [${RUN_ID}]`,
  contact: `Journey hello contact [${RUN_ID}]`,
  /** One searchable word, so the message search in 10.1/27.9 has a single token to match. */
  searchToken: `journeysearch${RUN_ID}`,
  realtime: `Journey realtime [${RUN_ID}]`,
  receipt: `Journey receipt [${RUN_ID}]`,
  unread: `Journey unread from Bob [${RUN_ID}]`,
  french: `Bonjour, je voudrais réserver une table pour deux personnes ce soir [${RUN_ID}]`,
  mention: `journey mention [${RUN_ID}]`,
  emoji: `Journey emoji [${RUN_ID}]`,
  boldToken: `journeybold${RUN_ID}`,
};
const GROUP_MESSAGE = `Journey group message ${TEXT.searchToken}`;
/** Seeded long ago (scripts/seed-e2e-data.ts), so it is reliably in the search index. */
// One distinctive word keeps the search query deterministic.
const SEARCHABLE = { query: 'Figma', text: 'Should we use Figma?', chat: 'Design Team' };

// ─── REST fixtures ───────────────────────────────────────────────────────────

async function createContactUser(): Promise<void> {
  const res = await fetch(`${restBase()}/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ uid: CONTACT.uid, name: CONTACT.name }),
  });
  if (!res.ok) throw new Error(`creating ${CONTACT.uid} failed: HTTP ${String(res.status)} ${await res.text()}`);
}

async function deleteContactUser(): Promise<void> {
  await fetch(`${restBase()}/users/${CONTACT.uid}`, {
    method: 'DELETE',
    headers: adminHeaders(),
    body: JSON.stringify({ permanent: true }),
  });
}

/** Best effort: the cleanup script also removes E2E_Test_* groups. */
async function deleteGroupsNamed(names: string[]): Promise<void> {
  for (const name of names) {
    const res = await fetch(`${restBase()}/groups?searchKey=${encodeURIComponent(name)}&perPage=100`, {
      headers: adminHeaders(),
    });
    const payload = (await res.json()) as { data?: { guid: string; name: string }[] };
    for (const group of payload.data ?? []) {
      if (group.name !== name) continue;
      await fetch(`${restBase()}/groups/${group.guid}`, { method: 'DELETE', headers: adminHeaders() });
    }
  }
}

/** Options for every browser context this file opens (the config's `use` does not reach browser.newContext). */
function contextOptions(extraPermissions: string[] = []) {
  const use = test.info().project.use;
  return {
    baseURL: use.baseURL,
    viewport: use.viewport ?? { width: 1600, height: 900 },
    permissions: ['microphone', 'camera', ...extraPermissions],
  };
}

/** A second, independent session for another user; always closed, even when the step fails. */
async function withSecondUser(browser: Browser, uid: string, fn: (other: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext(contextOptions());
  try {
    const other = await context.newPage();
    await loginToApp(other, uid);
    await fn(other);
  } finally {
    await context.close();
  }
}

test.describe('Full App Journey', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let page: Page;
  let group: ThrowawayGroup;
  /** Set in 2.4, voted on in 2.9. */
  let pollQuestion = '';
  /** Set in 3.1, inspected in 3.4 and removed in 3.5. */
  let reaction = '';

  test.beforeAll(async ({ browser }) => {
    await createContactUser();
    group = await createThrowawayGroup({ name: GROUP_NAME, owner: PRIMARY_USER, members: [SECONDARY_USER] });
    // A first message puts the throwaway group in Alice's conversation list (25.x).
    await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Journey group start [${RUN_ID}]` });

    const context = await browser.newContext(contextOptions(['clipboard-read', 'clipboard-write']));
    page = await context.newPage();
    await loginToApp(page, PRIMARY_USER);
  });

  test.afterAll(async () => {
    await page?.context().close().catch(() => undefined);
    await group?.dispose().catch(() => undefined);
    await deleteContactUser().catch(() => undefined);
    await deleteGroupsNamed(UI_GROUPS.map(g => g.name)).catch(() => undefined);
  });

  // ─── Shared locators and flows ───────────────────────────────────────────────

  const composerInput = () =>
    page.locator('.cometchat-messages-wrapper .cometchat-message-composer [contenteditable="true"]').first();
  const header = () => page.locator('.cometchat-messages-wrapper .cometchat-message-header').first();
  const headerTitle = () => page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first();
  const sidePanel = () => page.locator('.side-component-wrapper');
  const threadPanel = () => page.locator('.cometchat-thread-panel');
  const mainReplyPreview = () =>
    page.locator('.cometchat-messages-wrapper .cometchat-message-composer__reply-preview').first();
  const callButton = (kind: 'voice' | 'video', root: Page = page) =>
    root
      .locator('.cometchat-messages-wrapper .cometchat-message-header .cometchat-call-buttons__button')
      .filter({ has: root.locator(`.cometchat-call-buttons__button-icon--${kind}`) })
      .first();

  /** The bubble in the open conversation's main list (never the thread panel) containing `text`. */
  const mainBubble = (text: string) =>
    page.locator(`${MAIN_LIST} .cometchat-message-bubble__wrapper`).filter({ hasText: text }).first();

  async function openTab(name: 'Chats' | 'Calls' | 'Users' | 'Groups') {
    await page.locator('.cometchat-tab-component__tab').filter({ hasText: name }).first().click();
  }

  async function expectNoOpenMenu() {
    // Closed dropdowns stay in the DOM with display:none, which getByRole skips.
    await expect(page.getByRole('menuitem')).toHaveCount(0, { timeout: 5_000 });
  }

  async function openStrategy() {
    await openStrategyChatFromConversations(page);
    const firstBubble = page.locator(`${MAIN_LIST} .cometchat-message-bubble`).first();
    // Known issue: opening a chat right after load can leave the list
    // permanently blank. The group-details and message-list specs enforce the
    // fix; here it would block every later step, so record it in the report
    // and reopen the chat once.
    if (!(await visibleWithin(firstBubble, 15_000))) {
      test.info().annotations.push({ type: 'known-bug', description: 'blank message list right after load; chat reopened' });
      await page.locator('.cometchat-conversations__item').filter({ hasNotText: 'Strategy' }).first().click();
      await openStrategyChatFromConversations(page);
    }
    await expect(firstBubble).toBeVisible({ timeout: 20_000 });
  }

  async function openContactFromChats() {
    await openChatsTab(page);
    await conversationItem(page, CONTACT.name).click();
    await waitForChatOpen(page, CONTACT.name, { expectMessages: true });
  }

  /** Type into the main composer, send with Enter, and wait for the server to accept it. */
  async function sendText(text: string) {
    const input = composerInput();
    await input.click();
    await page.keyboard.type(text);
    await expectSendAccepted(page, () => input.press('Enter'));
    await expect(mainBubble(text)).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Click a bubble's hover quick action ("React" / "Reply") until `opened` shows. The kit
   * closes popovers on any list scroll, so a late receipt can undo the first click.
   */
  async function clickQuickAction(bubble: Locator, label: 'React' | 'Reply', opened: Locator) {
    await waitForBubbleSettled(bubble);
    await expect(async () => {
      if (await opened.isVisible()) return;
      await bubble.locator('.cometchat-message-bubble__body').first().hover();
      await bubble.locator(`button[aria-label="${label}"]`).first().click({ timeout: 3_000 });
      await expect(opened).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
  }

  function attachmentList() {
    return page.locator('.cometchat-message-composer__attachment-list').first();
  }

  async function openAttachmentOption(label: string) {
    await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__attachment-button').first().click();
    await expect(attachmentList()).toBeVisible({ timeout: 5_000 });
    return attachmentList()
      .locator('.cometchat-message-composer__attachment-option')
      .filter({ has: page.locator(`.cometchat-message-composer__attachment-option-title:has-text("${label}")`) })
      .first();
  }

  /** Stage one file through the attachment menu, send it, and wait for a new `bubbleClass` bubble. */
  async function sendAttachment(label: string, file: string, bubbleClass: string): Promise<Locator> {
    const bubbles = page.locator(`${MAIN_LIST} ${bubbleClass}`);
    const before = await bubbles.count();

    const option = await openAttachmentOption(label);
    const chooser = page.waitForEvent('filechooser', { timeout: 5_000 });
    await option.click();
    await (await chooser).setFiles(path.join(FIXTURES, file));
    await expect(attachmentList()).toBeHidden();

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 10_000 });
    await expect(tray.locator('.cometchat-message-composer__tray-progress')).toHaveCount(0, { timeout: 60_000 });
    const send = page.locator('.cometchat-message-composer__send-button--active').first();
    await expectSendAccepted(page, () => send.click());
    await expect(tray).toBeHidden({ timeout: 15_000 });

    await expect.poll(() => bubbles.count(), { timeout: 15_000 }).toBeGreaterThan(before);
    return bubbles.last();
  }

  /** Collaborative bubbles are created server-side by the extension and arrive over the socket. */
  async function createCollaborative(label: 'Whiteboard' | 'Document', kind: 'whiteboard' | 'document') {
    // Baseline BEFORE creating: the bubble can arrive while the menu is still being driven.
    const bubbles = page.locator(`${MAIN_LIST} .cometchat-collaborative-bubble--${kind}`);
    const before = await bubbles.count();

    await (await openAttachmentOption(label)).click();
    await expect(attachmentList()).toBeHidden();

    // Asserted in realtime (no reload), so a dead socket fails the step.
    await expect.poll(() => bubbles.count(), { timeout: 20_000 }).toBeGreaterThan(before);
    const open = bubbles.last().locator('.cometchat-collaborative-bubble__button');
    await expect(open).toBeVisible();
    // The Open button is disabled unless the extension returned a URL to open.
    await expect(open).toBeEnabled();
    await expect(open).toHaveText(/open/i);
  }

  async function closeThreadPanel() {
    await page.locator('.cometchat-thread-header__close-button').first().click();
    await expect(threadPanel()).toHaveCount(0, { timeout: 10_000 });
  }

  async function closeSidePanel() {
    await sidePanel().first().locator('.side-component-header__icon').click();
    await expect(sidePanel()).toHaveCount(0, { timeout: 10_000 });
  }

  /** The global search (opened from the conversations search bar). */
  async function openGlobalSearch(): Promise<Locator> {
    await openChatsTab(page);
    await page.locator('.cometchat-conversations__search-bar').first().click();
    const search = page.locator('.selector-wrapper-search .cometchat-search').first();
    await expect(search).toBeVisible({ timeout: 10_000 });
    return search;
  }

  async function closeGlobalSearch(search: Locator) {
    await search.locator('.cometchat-search__back-button').first().click();
    await expect(page.locator('.selector-wrapper-search')).toHaveCount(0, { timeout: 10_000 });
  }

  /**
   * Type `term` into a search and wait for a message result containing it. Search is
   * eventually consistent (a just-sent message may not be indexed yet), so the query is
   * re-issued until the result shows.
   */
  async function messageResult(search: Locator, term: string, expectText: string = term): Promise<Locator> {
    const input = search.locator('.cometchat-search__input input').first();
    const hit = search.locator('.cometchat-search__messages-list-item').filter({ hasText: expectText }).first();
    await expect(async () => {
      await input.fill('');
      await input.fill(term);
      await expect(hit).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
    return hit;
  }

  /** Open a conversation row's Pin/Delete context menu (the row must be in view). */
  async function openRowMenu(row: Locator) {
    const del = page.getByRole('menuitem', { name: 'Delete', exact: true });
    await expect(async () => {
      if (await del.isVisible()) return;
      await row.hover();
      await row.locator('.cometchat-conversations__item-options button').first().click({ timeout: 2_000 });
      await expect(del).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 1: CONVERSATIONS TAB
  // ═══════════════════════════════════════════════════════════

  test('1.1 — Conversations list loads with items', async () => {
    await expect(page.locator('.cometchat-conversations')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.cometchat-conversations__loading-state')).toBeHidden({ timeout: 30_000 });
    const items = page.locator('.cometchat-conversations__item');
    await expect(items.nth(1)).toBeVisible({ timeout: 30_000 });
    await expect(items.first().locator('.cometchat-conversations__item-title')).toHaveText(/\S/);
    await expect(items.first().locator('.cometchat-avatar')).toBeVisible();
  });

  test('1.2 — Open the Strategy conversation from the Chats list', async () => {
    await openStrategy();
    await expect(headerTitle()).toHaveText('Strategy');
    await expect(composerInput()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: SEND MESSAGES (Strategy)
  // ═══════════════════════════════════════════════════════════

  test('2.1 — Send a text message and verify it appears', async () => {
    await sendText(TEXT.m1);
    await expect(composerInput()).toHaveText('');
  });

  test('2.2 — Send an image attachment', async () => {
    const bubble = await sendAttachment('Image', 'test-image.png', '.cometchat-images-bubble');
    await expect(bubble.locator('.cometchat-images-bubble__image-wrapper img').first()).toBeVisible();
  });

  test('2.3 — Send a file attachment', async () => {
    const bubble = await sendAttachment('File', 'test-file.pdf', '.cometchat-files-bubble');
    await expect(bubble).toContainText('test-file.pdf');
  });

  test('2.4 — Create a poll from the attachment menu', async () => {
    pollQuestion = await createPoll(page, `Journey poll ${RUN_ID}`);
    // Created server-side and delivered over the socket — no reload fallback.
    const poll = page.locator(`${MAIN_LIST} .cometchat-poll-bubble`).filter({ hasText: pollQuestion }).first();
    await expect(poll).toBeVisible({ timeout: 20_000 });
    await expect(poll.getByRole('radio')).toHaveCount(2);
    await expect(attachmentList()).toBeHidden();
  });

  test('2.5 — Collaborative whiteboard bubble arrives with an Open button', async () => {
    await createCollaborative('Whiteboard', 'whiteboard');
  });

  test('2.6 — Collaborative document bubble arrives with an Open button', async () => {
    await createCollaborative('Document', 'document');
  });

  test('2.7 — Send a video attachment', async () => {
    const bubble = await sendAttachment('Video', 'test-video.mp4', '.cometchat-videos-bubble');
    await expect(bubble).toBeVisible();
  });

  test('2.8 — Send an audio attachment', async () => {
    const bubble = await sendAttachment('Audio', 'test-audio.mp3', '.cometchat-audios-bubble');
    await expect(bubble.locator('.cometchat-audios-bubble__name').first()).toContainText('test-audio.mp3');
  });

  test('2.9 — Vote on the poll', async () => {
    const poll = page.locator(`${MAIN_LIST} .cometchat-poll-bubble`).filter({ hasText: pollQuestion }).first();
    const optionA = poll.getByRole('radio', { name: /^Option A,/ });
    await expect(optionA).toHaveAttribute('aria-checked', 'false');

    await optionA.click();
    await expect(optionA).toHaveAttribute('aria-checked', 'true');
    await expect(optionA.locator('.cometchat-poll-bubble__option-count')).toHaveText('1');
    // Only announced once the extension accepts the vote (a failure rolls the optimistic vote back).
    await expect(poll.locator('.cometchat-poll-bubble__sr-only')).toHaveText('Vote submitted for Option A', {
      timeout: 15_000,
    });
  });

  test('2.10 — Play and pause the audio message', async () => {
    const play = page.locator(`${MAIN_LIST} .cometchat-audios-bubble`).last().locator('.cometchat-audios-bubble__play-btn').first();
    await expect(play).toHaveAttribute('aria-label', 'Play audio');
    await play.click();
    await expect(play).toHaveAttribute('aria-label', 'Pause audio', { timeout: 10_000 });
    await play.click();
    await expect(play).toHaveAttribute('aria-label', 'Play audio');
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: MESSAGE ACTIONS — on the 2.1 message
  // ═══════════════════════════════════════════════════════════

  test('3.1 — React to the message', async () => {
    const bubble = mainBubble(TEXT.m1);
    const picker = page.locator('.cometchat-message-list__emoji-picker-overlay .cometchat-emoji-keyboard').first();
    await clickQuickAction(bubble, 'React', picker);

    const emoji = picker.locator('.cometchat-emoji-keyboard__emoji-item').first();
    await expect(emoji).toBeVisible();
    reaction = (await emoji.innerText()).trim();
    await emoji.click();
    await expect(page.locator('.cometchat-message-list__emoji-picker-overlay')).toHaveCount(0);

    const chip = bubble.locator('.cometchat-reactions__chip--active').filter({ hasText: reaction });
    await expect(chip).toBeVisible({ timeout: 10_000 });
    await expect(chip.locator('.cometchat-reactions__chip-count')).toHaveText('1');
  });

  test('3.2 — Hovering the reaction shows who reacted', async () => {
    const chip = mainBubble(TEXT.m1).locator('.cometchat-reactions__chip--active').filter({ hasText: reaction });
    const info = page.locator('.cometchat-reactions__info').first();
    // Reactor names come from the server, so this also proves the reaction persisted.
    // The tooltip fetches once per hover and the server may not list a reaction
    // made a moment ago, so re-hover until it does (meanwhile the tooltip
    // shows " and 1 others").
    await knownIssue(
      "the who-reacted tooltip can list no names (\" and 1 others\") for a reaction made a moment ago",
      async () => {
        await expect(async () => {
          await page.mouse.move(0, 0);
          await chip.hover();
          await expect(info.locator('.cometchat-reactions__info-title')).toHaveText('You', { timeout: 3_000 });
        }).toPass({ timeout: 20_000 });
      },
      { intermittent: true }
    );

    await page.mouse.move(0, 0);
    await expect(page.locator('.cometchat-reactions__info')).toHaveCount(0);
  });

  test('3.3 — Clicking your own reaction again removes it', async () => {
    const bubble = mainBubble(TEXT.m1);
    await bubble.locator('.cometchat-reactions__chip--active').filter({ hasText: reaction }).click();
    await expect(bubble.locator('.cometchat-reactions__chip')).toHaveCount(0, { timeout: 10_000 });
  });

  test('3.4 — Edit the message and see the edited label', async () => {
    await openActionSheet(page, mainBubble(TEXT.m1));
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await expectNoOpenMenu();

    const preview = page.locator('.cometchat-messages-wrapper .cometchat-message-composer__edit-preview').first();
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(TEXT.m1);
    const input = composerInput();
    await expect(input).toContainText(TEXT.m1);

    await input.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type(TEXT.m1Edited);
    await input.press('Enter');

    await expect(preview).toBeHidden();
    await expect(input).toHaveText('');
    const edited = mainBubble(TEXT.m1Edited);
    await expect(edited).toBeVisible({ timeout: 15_000 });
    await expect(edited.locator('.cometchat-message-bubble__status-info-view-helper-text')).toBeVisible();
    await expect(mainBubble(TEXT.m1)).toHaveCount(0);
  });

  test('3.5 — Delete a message: cancel keeps it, confirm leaves a deleted bubble', async () => {
    await sendText(TEXT.toDelete);
    const target = mainBubble(TEXT.toDelete);
    const dialog = page.locator('.cometchat-confirm-dialog').first();

    await openActionSheet(page, target);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator('.cometchat-confirm-dialog__actions-cancel button').click();
    await expect(dialog).toBeHidden();
    await expect(target).toBeVisible();

    const deleted = page.locator(`${MAIN_LIST} .cometchat-delete-bubble`);
    const deletedBefore = await deleted.count();
    await openActionSheet(page, target);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator('.cometchat-confirm-dialog__actions-confirm button').click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(mainBubble(TEXT.toDelete)).toHaveCount(0, { timeout: 10_000 });
    await expect.poll(() => deleted.count(), { timeout: 10_000 }).toBeGreaterThan(deletedBefore);
    await expect(deleted.last()).toHaveText(/This message was deleted/);
  });

  test('3.6 — Reply shows the quoted message in the composer, and closing clears it', async () => {
    await clickQuickAction(mainBubble(TEXT.m1Edited), 'Reply', mainReplyPreview());
    await expect(mainReplyPreview()).toContainText(TEXT.m1Edited);

    await mainReplyPreview().locator('.cometchat-message-composer__reply-preview-close').click();
    await expect(mainReplyPreview()).toBeHidden();
  });

  test('3.7 — A sent reply renders the quoted message inside its bubble', async () => {
    await clickQuickAction(mainBubble(TEXT.m1Edited), 'Reply', mainReplyPreview());
    await sendText(TEXT.quote);
    await expect(mainReplyPreview()).toBeHidden();

    const quoted = mainBubble(TEXT.quote).locator('.cometchat-message-bubble__body-reply-view').first();
    await expect(quoted).toBeVisible();
    await expect(quoted).toContainText(TEXT.m1Edited);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: THREAD REPLIES
  // ═══════════════════════════════════════════════════════════

  test('4.1 — Reply in thread on the message', async () => {
    const parent = mainBubble(TEXT.m1Edited);
    await openThreadFor(page, parent);
    await expect(threadPanel().locator('.cometchat-thread-header').first()).toContainText(TEXT.m1Edited);

    await sendThreadReply(page, TEXT.thread1);
    await expect(threadBubbleWithText(page, TEXT.thread1)).toBeVisible();

    await closeThreadPanel();
    await expect(parent.locator('.cometchat-thread-view')).toHaveAttribute('aria-label', /^1 /, { timeout: 10_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 5: USERS TAB (throwaway contact)
  // ═══════════════════════════════════════════════════════════

  test('5.1 — Switch to the Users tab and browse users', async () => {
    await openTab('Users');
    const items = page.locator('.cometchat-users__item');
    await expect(items.nth(1)).toBeVisible({ timeout: 30_000 });
    await expect(items.first().locator('.cometchat-users__item-title')).toHaveText(/\S/);
    await expect(items.first().locator('.cometchat-avatar')).toBeVisible();
  });

  test('5.2 — Search the Users list and open the contact', async () => {
    const items = page.locator('.cometchat-users__item');
    const search = page.locator('.cometchat-users__search-bar input').first();
    await search.fill(CONTACT.name);
    const contact = items.filter({ hasText: CONTACT.name }).first();
    await expect(contact).toBeVisible({ timeout: 15_000 });
    await expect(items.filter({ hasNotText: CONTACT.name })).toHaveCount(0, { timeout: 15_000 });

    await contact.click();
    await waitForChatOpen(page, CONTACT.name);
    await expect(contact).toHaveAttribute('aria-selected', 'true');

    await search.fill('');
    await expect(items.nth(1)).toBeVisible({ timeout: 15_000 });
  });

  test('5.3 — Send a message to the contact', async () => {
    await sendText(TEXT.contact);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 6: GROUPS TAB
  // ═══════════════════════════════════════════════════════════

  test('6.1 — Switch to the Groups tab and browse groups', async () => {
    await openTab('Groups');
    const items = page.locator('.cometchat-groups__item');
    await expect(items.nth(1)).toBeVisible({ timeout: 30_000 });
    await expect(items.first().locator('.cometchat-groups__item-title')).toHaveText(/\S/);
  });

  test('6.2 — Search Groups for Strategy, open it and send a message', async () => {
    const items = page.locator('.cometchat-groups__item');
    const search = page.locator('.cometchat-groups__search-bar input').first();
    await search.fill('Strategy');
    const strategy = items.filter({ hasText: 'Strategy' }).first();
    await expect(strategy).toBeVisible({ timeout: 15_000 });
    await expect(items.filter({ hasNotText: 'Strategy' })).toHaveCount(0, { timeout: 15_000 });

    await strategy.click();
    await waitForChatOpen(page, 'Strategy', { expectMessages: true });
    await search.fill('');
    await expect(items.nth(1)).toBeVisible({ timeout: 15_000 });

    await sendText(GROUP_MESSAGE);
  });

  test('6.3 — Group details shows the group and its members', async () => {
    await headerTitle().click();
    const panel = sidePanel().first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.locator('.side-component-content__title')).toHaveText('Strategy');
    await expect(panel.locator('.side-component-content__description')).toHaveText(/member/i);
    await expect(panel.locator('.cometchat-group-members__item').filter({ hasText: BOB_NAME })).toBeVisible({
      timeout: 15_000,
    });
    await closeSidePanel();
  });

  // On the throwaway group, so Strategy's membership never changes.
  test('6.4 — Change a member scope from the group members list', async () => {
    await selectGroupByName(page, GROUP_NAME);
    await waitForChatOpen(page, GROUP_NAME);
    await headerTitle().click();
    const panel = sidePanel().first();
    await expect(panel).toBeVisible({ timeout: 10_000 });

    const bob = panel.locator('.cometchat-group-members__item').filter({ hasText: BOB_NAME }).first();
    await expect(bob).toBeVisible({ timeout: 15_000 });
    const changeScope = page.getByRole('menuitem', { name: 'Change Scope', exact: true });
    await expect(async () => {
      if (await changeScope.isVisible()) return;
      await bob.hover();
      await bob.locator('.cometchat-group-members__item-menu [aria-haspopup="true"]').first().click({ timeout: 2_000 });
      await expect(changeScope).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await changeScope.click();

    const dialog = page.locator('.cometchat-change-scope').first();
    await expect(dialog).toBeVisible();
    await dialog.locator('.cometchat-change-scope__list-item').filter({ hasText: 'Admin' }).click();
    await dialog.locator('.cometchat-change-scope__submit-button button').click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(bob.locator('.cometchat-group-members__item-role-badge')).toHaveText('Admin', { timeout: 10_000 });

    await closeSidePanel();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 7: CALLS TAB — runs as 18.6, once this journey has made calls,
  // so the log has an entry to assert on instead of "list or empty state".
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // SECTION 8: BACK TO CHATS — MESSAGE HEADER
  // ═══════════════════════════════════════════════════════════

  test('8.1 — Back on Chats, the header shows name, avatar and member count', async () => {
    await openStrategy();
    await expect(headerTitle()).toHaveText('Strategy');
    await expect(header().locator('.cometchat-avatar').first()).toBeVisible();
    await expect(header().locator('.cometchat-message-header__subtitle').first()).toHaveText(/member/i);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 9: REAL-TIME — a second user (Bob, own browser context)
  // ═══════════════════════════════════════════════════════════

  test('9.1 — Bob receives Alice’s message in real time', async ({ browser }) => {
    await openStrategy();
    await withSecondUser(browser, SECONDARY_USER, async bob => {
      const row = conversationItem(bob, 'Strategy');
      await expect(row).toBeVisible({ timeout: 30_000 });
      // Bob opens the chat first: a chat with unread messages opens at the first
      // unread, so a message sent before he opens it may not be loaded yet.
      await row.click();
      await waitForChatOpen(bob, 'Strategy', { expectMessages: true });
      // Bob rarely reads Strategy, so it opens at his first unread message, far back, where a new
      // message is only counted on the scroll-to-bottom button. Opening it marked it read, so
      // leave and come back: it now opens at the latest message.
      const toBottom = bob.locator('.cometchat-messages-wrapper .cometchat-message-list__scroll-to-bottom').first();
      if (await toBottom.isVisible()) {
        await bob.locator('.cometchat-conversations__item').filter({ hasNotText: 'Strategy' }).first().click();
        await row.click();
        await waitForChatOpen(bob, 'Strategy', { expectMessages: true });
        await expect(toBottom).toBeHidden({ timeout: 15_000 });
      }

      await sendText(TEXT.realtime);
      await expect(
        bob.locator(`${MAIN_LIST} .cometchat-message-bubble__wrapper`).filter({ hasText: TEXT.realtime })
      ).toBeVisible({ timeout: 15_000 });
      await expect(row.locator('.cometchat-conversations__item-subtitle')).toContainText(TEXT.realtime, {
        timeout: 20_000,
      });
    });
  });

  // Asserted on the receiver, where the indicator actually shows.
  test('9.2 — Bob’s typing shows in Alice’s header and clears when he stops', async ({ browser }) => {
    await openStrategy();
    await withSecondUser(browser, SECONDARY_USER, async bob => {
      await openStrategyChatFromConversations(bob);
      const bobComposer = bob.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
      await bobComposer.click();
      await bobComposer.pressSequentially(`typing ${RUN_ID}`, { delay: 80 });

      const typing = page.locator(
        '.cometchat-messages-wrapper .cometchat-message-header__subtitle--typing, .cometchat-messages-wrapper .cometchat-typing-indicator'
      );
      await expect(typing.first()).toBeVisible({ timeout: 15_000 });

      await bobComposer.press('ControlOrMeta+a');
      await bobComposer.press('Backspace');
      await expect(typing).toHaveCount(0, { timeout: 20_000 });
      await expect(header().locator('.cometchat-message-header__subtitle').first()).toHaveText(/member/i);
    });
  });

  test('9.3 — A message goes delivered while Bob is online, then read when he opens the chat', async ({
    browser,
  }) => {
    // A group message only shows delivered/read once every member has received/read it, so this
    // uses the journey's own group (Alice and Bob only), not Strategy, whose members vary by app.
    await selectGroupByName(page, GROUP_NAME);
    await waitForChatOpen(page, GROUP_NAME);
    await withSecondUser(browser, SECONDARY_USER, async bob => {
      // Bob is online on his conversation list, not in the group.
      await expect(conversationItem(bob, GROUP_NAME)).toBeVisible({ timeout: 30_000 });

      await sendText(TEXT.receipt);
      const bubble = mainBubble(TEXT.receipt);
      await expect(bubble.locator('.cometchat-receipts-delivered, .cometchat-receipts-read')).toBeVisible({
        timeout: 20_000,
      });

      await conversationItem(bob, GROUP_NAME).click();
      await waitForChatOpen(bob, GROUP_NAME, { expectMessages: true });
      await expect(bubble.locator('.cometchat-receipts-read')).toBeVisible({ timeout: 20_000 });
    });
  });

  test('9.4 — An unread badge appears for a message Bob sends, and clears on open', async () => {
    await openContactFromChats();
    await sendMessageToGroup({ guid: STRATEGY_GROUP, as: SECONDARY_USER, text: TEXT.unread });

    const row = conversationItem(page, 'Strategy');
    await expect(row.locator('.cometchat-conversations__item-subtitle')).toContainText(TEXT.unread, {
      timeout: 20_000,
    });
    const badge = row.locator('.cometchat-conversations__item-unread-badge');
    await expect(badge).toHaveText('1');

    await row.click();
    await waitForChatOpen(page, 'Strategy', { expectMessages: true });
    await expect(mainBubble(TEXT.unread)).toBeVisible({ timeout: 15_000 });
    await expect(badge).toHaveCount(0, { timeout: 10_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 10: SEARCH
  // ═══════════════════════════════════════════════════════════

  // Searches seeded history: search indexing lags new messages by a variable
  // amount, so a message sent minutes ago isn't a reliable target.
  test('10.1 — Global search finds a message', async () => {
    const search = await openGlobalSearch();
    const hit = await messageResult(search, SEARCHABLE.query, SEARCHABLE.text);
    await expect(hit).toContainText(SEARCHABLE.text);
    await closeGlobalSearch(search);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 11: TRANSLATE MESSAGE
  // ═══════════════════════════════════════════════════════════

  // The sample app enables Translate (`messageTranslation: true`). A French message is
  // used so the browser's en-US target differs from the source language.
  test('11.1 — Translate a message via the context menu', async () => {
    await openStrategy();
    await sendText(TEXT.french);
    const bubble = mainBubble(TEXT.french);

    await openActionSheet(page, bubble);
    await page.getByRole('menuitem', { name: 'Translate', exact: true }).click();
    await expectNoOpenMenu();

    const translation = bubble.locator('.cometchat-text-bubble__translation-text');
    await expect(translation).toBeVisible({ timeout: 20_000 });
    await expect(translation).toHaveText(/\S/);
    await expect(translation).not.toContainText('Bonjour');
    await expect(page.locator('.cometchat-toast__text').filter({ hasText: 'Message translated successfully.' })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 12: COPY MESSAGE
  // ═══════════════════════════════════════════════════════════

  test('12.1 — Copy the message puts its text on the clipboard and shows a toast', async () => {
    await openActionSheet(page, mainBubble(TEXT.m1Edited));
    await page.getByRole('menuitem', { name: 'Copy', exact: true }).click();
    await expectNoOpenMenu();

    await expect(page.locator('.cometchat-toast__text').filter({ hasText: 'Message copied to clipboard.' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(TEXT.m1Edited);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 13: MESSAGE INFO
  // ═══════════════════════════════════════════════════════════

  test('13.1 — Message info shows the message and Bob’s receipt', async () => {
    await openActionSheet(page, mainBubble(TEXT.m1Edited));
    await page.getByRole('menuitem', { name: 'Info', exact: true }).click();
    await expectNoOpenMenu();

    const info = page.getByRole('dialog', { name: 'Message Information' });
    await expect(info).toBeVisible({ timeout: 10_000 });
    await expect(info).toContainText(TEXT.m1Edited);
    // Bob opened Strategy in section 9, so he is on this message's receipt list.
    await expect(info.locator('.cometchat-message-information__user-item').filter({ hasText: BOB_NAME })).toBeVisible({
      timeout: 15_000,
    });

    await info.locator('.cometchat-message-information__header-close-button').click();
    await expect(info).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 14: THREAD CHAT (reopen, second reply, reply-preview leak)
  // ═══════════════════════════════════════════════════════════

  test('14.1 — Reopen the thread from its reply count and send a second reply', async () => {
    const parent = mainBubble(TEXT.m1Edited);
    await parent.locator('.cometchat-thread-view').click();

    const panel = threadPanel().first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.locator('.cometchat-thread-header').first()).toContainText(TEXT.m1Edited);
    await expect(panel.locator('.cometchat-thread-header__reply-count-text')).toHaveText('1 Reply');
    await expect(threadBubbleWithText(page, TEXT.thread1)).toBeVisible({ timeout: 10_000 });

    await sendThreadReply(page, TEXT.thread2);
    await expect(threadBubbleWithText(page, TEXT.thread2)).toBeVisible();
    await expect(panel.locator('.cometchat-thread-header__reply-count-text')).toHaveText('2 Replies', {
      timeout: 10_000,
    });

    await closeThreadPanel();
    await expect(parent.locator('.cometchat-thread-view')).toHaveAttribute('aria-label', /^2 /, { timeout: 10_000 });
  });

  test('14.2 — Replying inside the thread does not leak a reply preview into the main composer', async () => {
    await mainBubble(TEXT.m1Edited).locator('.cometchat-thread-view').click();
    await expect(threadPanel().first()).toBeVisible({ timeout: 10_000 });

    const threadPreview = page.locator('.cometchat-thread-panel .cometchat-message-composer__reply-preview').first();
    await clickQuickAction(threadBubbleWithText(page, TEXT.thread2), 'Reply', threadPreview);
    await expect(threadPreview).toContainText(TEXT.thread2);
    await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-composer__reply-preview')).toHaveCount(0);

    await threadPreview.locator('.cometchat-message-composer__reply-preview-close').click();
    await expect(threadPreview).toBeHidden();
    await closeThreadPanel();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 15: MENTIONS IN COMPOSER
  // ═══════════════════════════════════════════════════════════

  test('15.1 — Mention Bob from the @ suggestions, send, and see the mention', async () => {
    await openStrategy();
    const input = composerInput();
    await input.click();
    await page.keyboard.type('@');
    const suggestions = page.locator('.cometchat-message-composer__mentions-list').first();
    await expect(suggestions).toBeVisible({ timeout: 10_000 });
    await page.keyboard.type('Bob');
    const bob = suggestions.locator('.cometchat-group-members__item').filter({ hasText: BOB_NAME }).first();
    await expect(bob).toBeVisible({ timeout: 10_000 });
    await bob.click();
    await expect(suggestions).toBeHidden();
    await expect(input).toContainText(BOB_NAME);

    await page.keyboard.type(` ${TEXT.mention}`);
    await expectSendAccepted(page, () => input.press('Enter'));

    const bubble = mainBubble(TEXT.mention);
    await expect(bubble).toBeVisible({ timeout: 15_000 });
    await expect(bubble.locator('.cometchat-mentions').first()).toContainText(BOB_NAME);
    await openChatsTab(page);
    await expect(conversationItem(page, 'Strategy').locator('.cometchat-conversations__item-subtitle')).toContainText(
      TEXT.mention,
      { timeout: 15_000 }
    );
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 16: NEW CHAT (from the conversations header menu)
  // ═══════════════════════════════════════════════════════════

  test('16.1 — New chat: start a 1:1 from Users, browse Groups, and go back', async () => {
    const view = page.locator('.cometchat-new-chat-view');
    const openNewChat = async () => {
      await openChatsTab(page);
      await page.locator('.cometchat-conversations__header-menu button').first().click();
      await page.getByRole('menuitem', { name: 'Create conversation', exact: true }).click();
      await expect(view).toBeVisible({ timeout: 10_000 });
    };

    await openNewChat();
    await expect(view.locator('.cometchat-new-chat-view__tabs-tab-active')).toHaveText(/users/i);
    await view.locator('.cometchat-users__search-bar input').first().fill(CONTACT.name);
    await view.locator('.cometchat-users__item').filter({ hasText: CONTACT.name }).first().click();
    await expect(view).toHaveCount(0);
    await waitForChatOpen(page, CONTACT.name, { expectMessages: true });

    await openNewChat();
    await view.locator('.cometchat-new-chat-view__tabs-tab').filter({ hasText: 'Groups' }).click();
    await expect(view.locator('.cometchat-new-chat-view__tabs-tab-active')).toHaveText(/groups/i);
    await expect(view.locator('.cometchat-groups__item').first()).toBeVisible({ timeout: 30_000 });
    await view.locator('.cometchat-new-chat-view__header-back').click();
    await expect(view).toHaveCount(0);
    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 17: CREATE GROUP (all three types)
  // ═══════════════════════════════════════════════════════════

  test('17.1 — Create a public, a private and a password group', async () => {
    for (const [index, spec] of UI_GROUPS.entries()) {
      await openTab('Groups');
      await page.locator('.cometchat-groups__header-create-group-button').click();
      const dialog = page.locator('.cometchat-create-group__backdrop').first();
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      if (index === 0) {
        // Public is the default selection.
        await expect(dialog.getByRole('radio', { name: 'Public', exact: true })).toHaveAttribute('aria-checked', 'true');
      }

      const type = dialog.getByRole('radio', { name: spec.type, exact: true });
      await type.click();
      await expect(type).toHaveAttribute('aria-checked', 'true');
      await dialog.locator('.cometchat-create-group__input').first().fill(spec.name);
      const passwordInput = dialog.locator('input[type="password"]');
      if (spec.password) {
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill(spec.password);
      } else {
        await expect(passwordInput).toHaveCount(0);
      }

      await dialog.locator('.cometchat-create-group__submit-button').click();
      await expect(dialog).toBeHidden({ timeout: 15_000 });
      // The new group opens straight away.
      await waitForChatOpen(page, spec.name);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 18: VOICE & VIDEO CALLS (1:1 with the contact)
  // ═══════════════════════════════════════════════════════════

  test('18.1 — Voice call button is present in the 1:1 header', async () => {
    await openContactFromChats();
    await expect(callButton('voice')).toBeVisible();
    await expect(callButton('voice')).toBeEnabled();
    await expect(callButton('voice')).toHaveAttribute('aria-label', 'Voice call');
  });

  test('18.2 — Video call button is present in the 1:1 header', async () => {
    await expect(callButton('video')).toBeVisible();
    await expect(callButton('video')).toBeEnabled();
    await expect(callButton('video')).toHaveAttribute('aria-label', 'Video call');
  });

  test('18.3 — Voice call shows the outgoing call screen, and cancel dismisses it', async () => {
    await callButton('voice').click();
    const outgoing = page.locator('.cometchat-outgoing-call').first();
    await expect(outgoing).toBeVisible({ timeout: 15_000 });
    await expect(outgoing.locator('.cometchat-outgoing-call__title')).toHaveText(CONTACT.name);

    await outgoing.locator('.cometchat-outgoing-call__button').click();
    await expect(outgoing).toBeHidden({ timeout: 10_000 });
    await expect(callButton('voice')).toBeEnabled({ timeout: 10_000 });
  });

  test('18.4 — Video call shows the outgoing call screen, and cancel dismisses it', async () => {
    await callButton('video').click();
    const outgoing = page.locator('.cometchat-outgoing-call').first();
    await expect(outgoing).toBeVisible({ timeout: 15_000 });
    await expect(outgoing.locator('.cometchat-outgoing-call__title')).toHaveText(CONTACT.name);

    await outgoing.locator('.cometchat-outgoing-call__button').click();
    await expect(outgoing).toBeHidden({ timeout: 10_000 });
    await expect(callButton('video')).toBeEnabled({ timeout: 10_000 });
  });

  // The contact calls Alice from their own session.
  test('18.5 — An incoming call shows the caller with accept/decline, and decline ends it for both', async ({
    browser,
  }) => {
    await withSecondUser(browser, CONTACT.uid, async caller => {
      await caller.locator('.cometchat-tab-component__tab').filter({ hasText: 'Users' }).first().click();
      await caller.locator('.cometchat-users__search-bar input').first().fill(ALICE_NAME);
      await caller.locator('.cometchat-users__item').filter({ hasText: ALICE_NAME }).first().click();
      await waitForChatOpen(caller, ALICE_NAME);
      await callButton('voice', caller).click();
      const outgoing = caller.locator('.cometchat-outgoing-call').first();
      await expect(outgoing).toBeVisible({ timeout: 15_000 });

      const incoming = page.locator('.cometchat-incoming-call').first();
      await expect(incoming).toBeVisible({ timeout: 20_000 });
      await expect(incoming.locator('.cometchat-incoming-call__title')).toHaveText(CONTACT.name);
      await expect(incoming.locator('.cometchat-incoming-call__button-accept')).toBeVisible();

      await incoming.locator('.cometchat-incoming-call__button-decline').click();
      await expect(incoming).toBeHidden({ timeout: 10_000 });
      await expect(outgoing).toBeHidden({ timeout: 15_000 });
    });
  });

  // After the calls above, so the log has this run's entries.
  test('18.6 — Calls tab lists the call with its direction and time, and opens its details', async () => {
    const row = page.locator('.cometchat-call-logs__list-item').filter({ hasText: CONTACT.name }).first();
    // Call logs are eventually consistent: re-enter the tab (which refetches) until the entry shows.
    await expect(async () => {
      await openTab('Chats');
      await openTab('Calls');
      await expect(row).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
    await expect(row.locator('.cometchat-call-logs__list-item-subtitle-icon')).toBeVisible();
    await expect(row.locator('.cometchat-call-logs__list-item-subtitle-text')).toHaveText(/\S/);

    // Click the subtitle, not the row centre: the row's trailing button starts a call.
    await row.locator('.cometchat-call-logs__list-item-subtitle-text').click();
    const details = page.locator('.cometchat-call-log-details').first();
    await expect(details).toBeVisible({ timeout: 10_000 });
    await expect(details.locator('.cometchat-call-log-details__user-name')).toHaveText(CONTACT.name);

    // On desktop the details sit beside the list (the back arrow is mobile-only);
    // leaving the Calls tab closes them.
    await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
    await expect(page.locator('.cometchat-call-log-details')).toHaveCount(0);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 19: USER DETAILS PANEL
  // ═══════════════════════════════════════════════════════════

  test('19.1 — Open user details from the message header', async () => {
    await openContactFromChats();
    await headerTitle().click();
    const panel = sidePanel().first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.locator('.side-component-content__title')).toHaveText(CONTACT.name);
    await expect(panel.locator('.side-component-content__avatar')).toBeVisible();
    await expect(panel.locator('.side-component-content__action-item').filter({ hasText: 'Block' })).toBeVisible();
    await closeSidePanel();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 20: EMOJI, STICKERS AND FORMATTING IN THE COMPOSER (Strategy)
  // ═══════════════════════════════════════════════════════════

  test('20.1 — Emoji keyboard inserts an emoji that is sent with the message', async () => {
    await openStrategy();
    const input = composerInput();
    await input.click();
    await page.keyboard.type(`${TEXT.emoji} `);

    await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__emoji-button').first().click();
    const keyboard = page.locator('.cometchat-emoji-keyboard').first();
    await expect(keyboard).toBeVisible({ timeout: 5_000 });
    const item = keyboard.locator('.cometchat-emoji-keyboard__emoji-item').first();
    await expect(item).toBeVisible();
    const emoji = (await item.innerText()).trim();
    await item.click();
    await expect(input).toContainText(emoji);

    await page.keyboard.press('Escape');
    await expect(keyboard).toBeHidden();

    await expectSendAccepted(page, () => input.press('Enter'));
    await expect(mainBubble(TEXT.emoji)).toContainText(emoji, { timeout: 15_000 });
  });

  test('20.2 — Send a sticker, which renders as a sticker bubble', async () => {
    const stickers = page.locator(`${MAIN_LIST} .cometchat-sticker-bubble`);
    const before = await stickers.count();
    await sendSticker(page);
    await expect.poll(() => stickers.count(), { timeout: 15_000 }).toBeGreaterThan(before);
    // Visible only once the image has loaded with a real size.
    await expect(stickers.last().locator('.cometchat-sticker-bubble__image')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.cometchat-stickers-keyboard').first()).toBeHidden();
  });

  test('20.3 — Typed **bold** is previewed in the composer and sent as bold', async () => {
    const input = composerInput();
    await input.click();
    await page.keyboard.type(`**bold** ${TEXT.boldToken}`, { delay: 10 });
    await expect(input.locator('strong')).toHaveText('bold');

    await expectSendAccepted(page, () => input.press('Enter'));
    const text = page.locator(`${MAIN_LIST} .cometchat-text-bubble__text`).filter({ hasText: TEXT.boldToken }).last();
    await expect(text.locator('b')).toHaveText('bold', { timeout: 15_000 });
    await expect(text).not.toContainText('**');
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 21: VOICE RECORDING IN COMPOSER
  // ═══════════════════════════════════════════════════════════

  test('21.1 — Voice recording button starts the recorder, and delete discards it', async () => {
    // The voice button only shows while the composer is empty.
    await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-composer__input-placeholder')).toBeVisible();
    const voice = page.locator('.cometchat-messages-wrapper .cometchat-message-composer__voice-button').first();
    await expect(voice).toBeVisible();
    await voice.click();

    const overlay = page.locator('.cometchat-messages-wrapper .cometchat-message-composer__recording-overlay').first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    // Recording starts automatically: the pause control shows and the timer runs.
    await expect(overlay.locator('.cometchat-media-recorder__inline-pause')).toBeVisible({ timeout: 10_000 });
    await expect(overlay.locator('.cometchat-media-recorder__timer').first()).toHaveText(/^0:0[1-9]$/, { timeout: 10_000 });

    await overlay.locator('.cometchat-media-recorder__inline-delete').click();
    await expect(overlay).toBeHidden();
    await expect(voice).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 22: GROUP CALLING
  // ═══════════════════════════════════════════════════════════

  test('22.1 — Group call buttons are present in the group header', async () => {
    await expect(headerTitle()).toHaveText('Strategy');
    await expect(callButton('voice')).toBeVisible();
    await expect(callButton('voice')).toBeEnabled();
    await expect(callButton('video')).toBeVisible();
    await expect(callButton('video')).toBeEnabled();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 23: REPLY TO MESSAGE — runs as 3.6, while the 2.1 message is
  // still within the first page of the list.
  // SECTION 24: AI ASSISTANT — covered by ai-assistant-chat.spec.ts (needs an agent on the app).
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // SECTION 25: CONVERSATION LIST CONTEXT MENU (throwaway group)
  // ═══════════════════════════════════════════════════════════

  test('25.1 — Conversation row menu offers Pin and Delete', async () => {
    // Bump the throwaway group to the top so its row is in view.
    await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: `Journey bump [${RUN_ID}]` });
    await openChatsTab(page);
    const row = conversationItem(page, GROUP_NAME);
    await expect(row).toBeVisible({ timeout: 20_000 });

    await openRowMenu(row);
    await expect(page.getByRole('menuitem', { name: 'Pin conversation', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expectNoOpenMenu();
  });

  // React-only (conversations/delete-conversation.spec.ts) — destructive, throwaway group only.
  test('25.2 — Deleting the conversation removes it from the list', async () => {
    const row = conversationItem(page, GROUP_NAME);
    await openRowMenu(row);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

    const dialog = page.locator('.cometchat-conversations__delete-dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(row).toHaveCount(0, { timeout: 10_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 26: FULL-SCREEN IMAGE VIEWER
  // ═══════════════════════════════════════════════════════════

  // Sends its own image: the 2.2 image may have scrolled out of the first page by now.
  test('26.1 — Clicking an image opens the full-screen viewer, Escape closes it', async () => {
    await openStrategy();
    await sendImage(page, path.join(FIXTURES, 'test-image.png'));

    const wrapper = page.locator(`${MAIN_LIST} .cometchat-images-bubble`).last().locator('.cometchat-images-bubble__image-wrapper').first();
    const image = wrapper.locator('img').first();
    // The bubble first shows the local preview, then re-renders with the uploaded URL.
    await expect
      .poll(
        () => image.evaluate((el: HTMLImageElement) => !el.src.startsWith('blob:') && el.complete && el.naturalWidth > 0),
        { timeout: 20_000 }
      )
      .toBe(true);
    await wrapper.click();

    const viewer = page.locator('.cometchat-fullscreen-viewer').first();
    await expect(viewer).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden({ timeout: 5_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 27: BUG FIX REGRESSIONS
  // 27.1 runs as 3.5, 27.4 as 14.2 and 27.7 as 3.7 (they act on the 2.1 message).
  // ═══════════════════════════════════════════════════════════

  // Reloads to hit the load race.
  test('27.2 — Clicking a conversation while the list is loading does not show an error', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    const first = page.locator('.cometchat-conversations__item').first();
    await expect(first).toBeVisible({ timeout: 30_000 });
    await first.click();

    await expect(headerTitle()).toHaveText(/\S/, { timeout: 15_000 });
    // Known issue: opening a chat right after load can leave the message list blank.
    await expect(page.locator(`${MAIN_LIST} .cometchat-message-bubble`).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[class*="error-state"], [class*="something-went-wrong"]').first()).toBeHidden();
  });

  test('27.3 — The details panel stays open after the messages finish loading', async () => {
    await openChatsTab(page);
    await conversationItem(page, CONTACT.name).click();
    // Open the panel straight away, before the message list has loaded.
    await page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').filter({ hasText: CONTACT.name }).click();
    const panel = sidePanel().first();
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await waitForChatOpen(page, CONTACT.name, { expectMessages: true });
    await expect(panel).toBeVisible();
    await expect(panel.locator('.side-component-content__title')).toHaveText(CONTACT.name);
    await closeSidePanel();
  });

  test('27.5 — Scoped search starts with clean filters (no leak from global search)', async () => {
    await openStrategy();
    const global = await openGlobalSearch();
    await global.locator('.cometchat-search__body-filter').filter({ hasText: 'Audio' }).first().click();
    await expect(global.locator('.cometchat-search__body-filter--active')).toContainText('Audio');
    await closeGlobalSearch(global);

    await page.locator('.cometchat-messages-wrapper .cometchat-message-header__overflow-menu button').first().click();
    await page.getByRole('menuitem', { name: 'Search', exact: true }).click();
    const scoped = page.locator('.side-component-wrapper .cometchat-search').first();
    await expect(scoped).toBeVisible({ timeout: 10_000 });
    await expect(scoped.locator('.cometchat-search__body-filter').first()).toBeVisible();
    await expect(scoped.locator('.cometchat-search__body-filter--active')).toHaveCount(0);
    await expect(scoped.locator('.cometchat-search__input input').first()).toHaveValue('');

    await scoped.locator('.cometchat-search__back-button').first().click();
    await expect(sidePanel()).toHaveCount(0, { timeout: 10_000 });
  });

  test('27.6 — The attachment menu does not overflow into the conversation list', async () => {
    const leftPanel = await page.locator('.selector-wrapper').first().boundingBox();
    await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__attachment-button').first().click();
    await expect(attachmentList()).toBeVisible({ timeout: 5_000 });
    const menu = await attachmentList().boundingBox();
    if (!leftPanel || !menu) throw new Error('could not measure the conversation list or the attachment menu');
    expect(menu.x).toBeGreaterThanOrEqual(leftPanel.x + leftPanel.width - 10);

    await page.keyboard.press('Escape');
    await expect(attachmentList()).toBeHidden();
  });

  test('27.8 — The sticker keyboard closes after sending a sticker', async () => {
    await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__sticker-button').first().click();
    const keyboard = page.locator('.cometchat-stickers-keyboard').first();
    await expect(keyboard).toBeVisible({ timeout: 5_000 });
    const sticker = keyboard.locator('.cometchat-stickers-keyboard__sticker-item').first();
    await expect(sticker).toBeVisible({ timeout: 10_000 });

    const stickers = page.locator(`${MAIN_LIST} .cometchat-sticker-bubble`);
    const before = await stickers.count();
    await expectSendAccepted(page, () => sticker.click());
    await expect(keyboard).toBeHidden();
    await expect.poll(() => stickers.count(), { timeout: 15_000 }).toBeGreaterThan(before);
  });

  test('27.9 — Clicking a message search result scrolls to and highlights the message', async () => {
    const search = await openGlobalSearch();
    const hit = await messageResult(search, SEARCHABLE.query, SEARCHABLE.text);
    await hit.click();

    await expect(headerTitle()).toHaveText(SEARCHABLE.chat, { timeout: 15_000 });
    // The highlight is a 3 s CSS animation; the poll catches it while it runs.
    await expect(
      page.locator('.cometchat-messages-wrapper .cometchat-message-list__bubble-highlight').filter({ hasText: SEARCHABLE.text })
    ).toBeVisible({ timeout: 15_000 });
    await expect(mainBubble(SEARCHABLE.text)).toBeInViewport();

    await closeGlobalSearch(search);
  });

  test('27.10 — A sent voice note loads without "Failed to load audio"', async () => {
    await openStrategy();
    const notes = page.locator(`${MAIN_LIST} .cometchat-audio-bubble`);
    const before = await notes.count();

    await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__voice-button').first().click();
    const overlay = page.locator('.cometchat-messages-wrapper .cometchat-message-composer__recording-overlay').first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    await expect(overlay.locator('.cometchat-media-recorder__timer').first()).toHaveText(/^0:0[2-9]$/, { timeout: 15_000 });

    await expectSendAccepted(page, () => overlay.locator('.cometchat-message-composer__send-button').click());
    await expect(overlay).toBeHidden();
    await expect.poll(() => notes.count(), { timeout: 15_000 }).toBeGreaterThan(before);

    const note = notes.last();
    // Play is enabled only once the waveform has loaded without error.
    await expect(note.locator('.cometchat-audio-bubble__play-button')).toBeEnabled({ timeout: 30_000 });
    await expect(note.locator('.cometchat-audio-bubble__error-message')).toHaveCount(0);
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 28: MESSAGE LIST (Strategy has a full page of messages by now)
  // ═══════════════════════════════════════════════════════════

  test('28.1 — Scroll-to-bottom appears when scrolled up and returns to the latest message', async () => {
    const scroller = page.locator('.cometchat-messages-wrapper .cometchat-message-list__scroll-container').first();
    await expect.poll(() => scroller.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await scroller.evaluate(el => {
      el.scrollTop = 0;
    });

    // Scrolling to the top also fetches an older page; let it land before clicking.
    const bubbles = page.locator(`${MAIN_LIST} .cometchat-message-bubble`);
    let last = -1;
    await expect
      .poll(
        async () => {
          const n = await bubbles.count();
          const stable = n === last;
          last = n;
          return stable;
        },
        { intervals: [1_000], timeout: 15_000 }
      )
      .toBe(true);

    const button = page.locator('.cometchat-messages-wrapper .cometchat-message-list__scroll-to-bottom').first();
    await expect(button).toBeVisible({ timeout: 5_000 });
    await button.click();
    await expect
      .poll(() => scroller.evaluate(el => el.scrollHeight - el.scrollTop - el.clientHeight), { timeout: 10_000 })
      .toBeLessThanOrEqual(2);
    await expect(button).toBeHidden({ timeout: 5_000 });
  });

  test('28.2 — A "Today" date separator heads this run’s messages', async () => {
    await expect(
      page.locator('.cometchat-messages-wrapper .cometchat-message-list__date-separator').filter({ hasText: 'Today' })
    ).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 29: GROUP ADMINISTRATION — destructive, throwaway group only (React-only)
  // ═══════════════════════════════════════════════════════════

  test('29.1 — Delete and Exit removes the group', async () => {
    await selectGroupByName(page, GROUP_NAME);
    await waitForChatOpen(page, GROUP_NAME);
    await headerTitle().click();
    const panel = sidePanel().first();
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await panel.locator('.side-component-content__action-item').filter({ hasText: 'Delete and Exit' }).click();
    const dialog = page.locator('.cometchat-confirm-dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.locator('.cometchat-confirm-dialog__actions-confirm button').click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(sidePanel()).toHaveCount(0, { timeout: 10_000 });
    await expect(
      page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').filter({ hasText: GROUP_NAME })
    ).toHaveCount(0, { timeout: 10_000 });
    await expect
      .poll(async () => (await fetch(`${restBase()}/groups/${group.guid}`, { headers: adminHeaders() })).ok, {
        timeout: 15_000,
      })
      .toBe(false);
  });
});
