import { test, expect, Page, Locator } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

/**
 * E2E Tests — Markdown formatting: composer preview vs. sent message (React)
 *
 * The same text passes through several independent formatting passes: the
 * composer as you type, the composer on paste, and the message bubble after
 * send. These tests type or paste real input, send it, and check that what the
 * bubble renders agrees with what the composer showed — including the cases
 * that previously broke:
 *
 * - URLs containing underscores (a Google Drive share link carries two) must
 *   stay intact rather than being partly italicised and truncated.
 * - Markdown typed in the composer must render as formatting after send. The
 *   composer parks the caret in a zero-width space after each conversion; if
 *   that character reaches the message, the closing marker no longer matches
 *   and the raw asterisks show.
 * - Markers between word characters (`snake_case_name`) are plain text.
 * - A code span keeps markers literal.
 */

const STRATEGY_GROUP = 'e2e-group-35';
const SECONDARY_UID = 'e2e-user-2';
/**
 * Shaped like a file-share link: one underscore in the id and another in the
 * query string. That pair is what the markdown rules used to treat as italic
 * markers, cutting the address in half.
 */
const SHARE_URL = 'https://example.com/file/d/1AbCdEfGhIj_kLmNoPqRsTu-9vWxY/view?usp=drive_link';
const ZERO_WIDTH_SPACE = '​';

/** A short token unique to this message, so a test can find its own bubble. */
function uniqueToken(): string {
  return `md${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function composerInput(page: Page): Locator {
  return page.locator('.cometchat-message-composer [contenteditable="true"]').first();
}

/** Type one key at a time, so the as-you-type markdown detector runs as it would for a user. */
async function typeInComposer(page: Page, text: string): Promise<void> {
  await composerInput(page).click();
  await page.keyboard.type(text, { delay: 10 });
}

/** Paste plain text, which the composer converts through its paste pass. */
async function pasteInComposer(page: Page, text: string): Promise<void> {
  const input = composerInput(page);
  await input.click();
  await input.evaluate((element, value) => {
    const data = new DataTransfer();
    data.setData('text/plain', value);
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
    );
  }, text);
}

async function sendComposer(page: Page): Promise<void> {
  await composerInput(page).press('Enter');
}

/** The rendered text of the sent bubble carrying `token`. */
function bubbleText(page: Page, token: string): Locator {
  return page
    .locator('.cometchat-message-list .cometchat-text-bubble__text')
    .filter({ hasText: token })
    .last();
}

async function bubbleHtml(page: Page, token: string): Promise<string> {
  const bubble = bubbleText(page, token);
  await expect(bubble).toBeVisible({ timeout: 15_000 });
  return bubble.innerHTML();
}

/**
 * Send a text message to the Strategy group over REST, as another user. Used to
 * put a message into the conversation exactly as stored, bypassing the composer.
 */
async function sendGroupMessageAs(uid: string, text: string): Promise<void> {
  const appId = process.env.COMETCHAT_APP_ID ?? '';
  const region = process.env.COMETCHAT_REGION ?? 'us';
  const domain = process.env.COMETCHAT_API_DOMAIN ?? 'cometchat.io';
  const response = await fetch(`https://${appId}.api-${region}.${domain}/v3/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.COMETCHAT_API_KEY ?? '',
      appid: appId,
      onBehalfOf: uid,
    },
    body: JSON.stringify({
      receiver: STRATEGY_GROUP,
      receiverType: 'group',
      category: 'message',
      type: 'text',
      data: { text },
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message as ${uid}: ${String(response.status)}`);
  }
}

test.describe('Markdown formatting — composer and sent message agree', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  // ==================== Typed markdown renders after send ====================

  const TYPED_FORMATS = [
    { name: 'bold followed by text', marker: '**bold**', tag: 'b', composerTag: 'strong', content: 'bold' },
    { name: 'italic followed by text', marker: '_italic_', tag: 'i', composerTag: 'em', content: 'italic' },
    { name: 'strikethrough followed by text', marker: '~~strike~~', tag: 's', composerTag: 's', content: 'strike' },
    { name: 'underline followed by text', marker: '__under__', tag: 'u', composerTag: 'u', content: 'under' },
  ];

  for (const format of TYPED_FORMATS) {
    test(`typed ${format.name} renders as formatting, not raw markers`, async () => {
      const token = uniqueToken();
      await typeInComposer(page, `${format.marker} ${token}`);

      // The composer previews the formatting while typing.
      await expect(composerInput(page).locator(format.composerTag)).toHaveText(format.content);

      await sendComposer(page);
      const html = await bubbleHtml(page, token);

      expect(html).toContain(`<${format.tag}>${format.content}</${format.tag}>`);
      expect(await bubbleText(page, token).textContent()).not.toContain(format.marker);
      expect(html).not.toContain(ZERO_WIDTH_SPACE);
    });
  }

  test('typed bold at the very end of a message still renders', async () => {
    const token = uniqueToken();
    await typeInComposer(page, `${token} **bold**`);
    await sendComposer(page);

    const html = await bubbleHtml(page, token);
    expect(html).toContain('<b>bold</b>');
    expect(await bubbleText(page, token).textContent()).not.toContain('**');
  });

  // ==================== Word boundaries ====================

  test('underscores between word characters stay plain text', async () => {
    const token = uniqueToken();
    const text = `snake_case_name_here my_var_name a_b ${token}`;
    await typeInComposer(page, text);

    await expect(composerInput(page).locator('em')).toHaveCount(0);
    await sendComposer(page);

    const html = await bubbleHtml(page, token);
    expect(html).not.toContain('<i>');
    expect(await bubbleText(page, token).textContent()).toContain(
      'snake_case_name_here my_var_name a_b'
    );
  });

  test('italic next to punctuation still applies', async () => {
    const token = uniqueToken();
    await typeInComposer(page, `This is _important_. ${token}`);
    await sendComposer(page);

    expect(await bubbleHtml(page, token)).toContain('<i>important</i>.');
  });

  // ==================== URLs with underscores ====================

  test('typed share link stays intact in the composer and the sent link', async () => {
    const token = uniqueToken();
    await typeInComposer(page, `${SHARE_URL} ${token}`);

    await expect(composerInput(page).locator('em')).toHaveCount(0);
    await sendComposer(page);

    await bubbleHtml(page, token);
    const link = bubbleText(page, token).locator('a').first();
    await expect(link).toHaveAttribute('href', SHARE_URL);
    await expect(link).toHaveText(SHARE_URL);
  });

  test('pasted text containing a share link keeps the link intact', async () => {
    const token = uniqueToken();
    await pasteInComposer(page, `See ${SHARE_URL} now ${token}`);

    await expect(composerInput(page)).toContainText(SHARE_URL);
    await expect(composerInput(page).locator('em')).toHaveCount(0);
    await sendComposer(page);

    await bubbleHtml(page, token);
    await expect(bubbleText(page, token).locator('a').first()).toHaveAttribute('href', SHARE_URL);
  });

  test('pasted markdown link with a bold label keeps its address', async () => {
    const token = uniqueToken();
    const url = 'https://example.com/d/abc_def?usp=share_link';
    await pasteInComposer(page, `[**report**](${url}) ${token}`);
    await sendComposer(page);

    await bubbleHtml(page, token);
    const link = bubbleText(page, token).locator('a').first();
    await expect(link).toHaveAttribute('href', url);
    await expect(link.locator('b')).toHaveText('report');
  });

  // ==================== Code spans ====================

  test('markers inside inline code stay literal', async () => {
    const token = uniqueToken();
    await pasteInComposer(page, `\`**not bold**\` ${token}`);
    await sendComposer(page);

    const html = await bubbleHtml(page, token);
    expect(html).toContain('<code>**not bold**</code>');
    expect(html).not.toContain('<b>not bold</b>');
  });

  // ==================== Messages already stored ====================

  test('a message stored with a caret marker still renders as formatting', async () => {
    const token = uniqueToken();
    // Exactly what the composer used to store for a typed "**bold** ..." message.
    await sendGroupMessageAs(SECONDARY_UID, `**bold**${ZERO_WIDTH_SPACE} legacy ${token}`);

    const html = await bubbleHtml(page, token);
    expect(html).toContain('<b>bold</b>');
    expect(await bubbleText(page, token).textContent()).not.toContain('**');
  });

  // ==================== Conversation subtitle ====================

  test('conversation subtitle shows the typed message without raw markers', async () => {
    const token = uniqueToken();
    await typeInComposer(page, `**bold** ${token}`);
    await sendComposer(page);
    await bubbleHtml(page, token);

    // The chat was opened from the Groups tab; the subtitle lives on the Chats tab.
    await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
    const subtitle = page
      .locator('.cometchat-conversations__item-subtitle')
      .filter({ hasText: token })
      .first();
    await expect(subtitle).toBeVisible({ timeout: 15_000 });
    const text = (await subtitle.textContent()) ?? '';
    expect(text).not.toContain('**');
    expect(text).not.toContain(ZERO_WIDTH_SPACE);
  });
});
