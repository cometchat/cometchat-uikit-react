import { test, expect, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER, expectSendAccepted } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { clickMessageOption, sendMessageToGroup } from '../helpers/pinSave';
import { bubbleWithText, openThreadFor, threadBubbleWithText, sendThreadReply } from '../helpers/threads';

/**
 * E2E — a formatted message wherever it shows up besides its own bubble (catalog D2, F3).
 *
 * In a throwaway group Alice has a message with bold and italic text. Previews (the reply
 * preview, the quote inside a reply, search results) show it as plain text without the
 * markdown markers; editing starts from the formatted text; and in a thread both the parent
 * and a formatted reply render the formatting.
 */

let group: ThrowawayGroup;
let token: string;
let message: string;
const PLAIN = 'Bold words and italic words';

test.beforeEach(async ({ page }) => {
  token = `fmt${String(Date.now())}`;
  message = `**Bold words** and _italic words_ ${token}`;
  group = await createThrowawayGroup({ name: `E2E Formatting ${token}`, owner: PRIMARY_USER, members: [SECONDARY_USER] });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: message });
  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name, { expectMessages: true });
  await expect(bubbleWithText(page, token).locator('b')).toHaveText('Bold words', { timeout: 15_000 });
});

test.afterEach(async () => {
  await group.dispose();
});

const composer = (page: Page) => page.locator('.cometchat-messages-wrapper .cometchat-message-composer').first();
const composerInput = (page: Page) => composer(page).locator('[contenteditable="true"]').first();

test('the reply preview and the quote in the reply show plain text', async ({ page }) => {
  const original = bubbleWithText(page, token);
  await original.locator('.cometchat-message-bubble__body').first().hover();
  await original.getByRole('button', { name: 'Reply', exact: true }).click();

  const preview = composer(page).locator('.cometchat-message-composer__reply-preview').first();
  await expect(preview).toContainText(PLAIN, { timeout: 5_000 });
  await expect(preview).not.toContainText('**');
  await expect(preview).not.toContainText('_italic');

  const reply = `Replying ${token}r`;
  await composerInput(page).click();
  await page.keyboard.type(reply);
  await expectSendAccepted(page, () => composerInput(page).press('Enter'), { text: reply });

  const quote = bubbleWithText(page, reply).locator('.cometchat-message-bubble__body-reply-view').first();
  await expect(quote).toContainText(PLAIN, { timeout: 15_000 });
  await expect(quote).not.toContainText('**');
});

test('editing starts from the formatted text, and the saved edit stays formatted', async ({ page }) => {
  await clickMessageOption(page, bubbleWithText(page, token), 'Edit');

  const editPreview = composer(page).locator('.cometchat-message-composer__edit-preview').first();
  await expect(editPreview).toContainText(PLAIN, { timeout: 5_000 });
  await expect(editPreview).not.toContainText('**');
  await expect(composerInput(page).locator('strong, b')).toHaveText('Bold words');
  await expect(composerInput(page).locator('em, i')).toHaveText('italic words');
  await expect(composerInput(page)).not.toContainText('**');

  await composerInput(page).click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' edited');
  await composerInput(page).press('Enter');

  const edited = bubbleWithText(page, `${token} edited`);
  await expect(edited.locator('b')).toHaveText('Bold words', { timeout: 15_000 });
  await expect(edited.locator('i')).toHaveText('italic words');
  await expect(edited).not.toContainText('**');
});

test('in a thread, the parent and a formatted reply render their formatting', async ({ page }) => {
  await openThreadFor(page, bubbleWithText(page, token));
  const parent = page.locator('.cometchat-thread-panel').first().locator('b').filter({ hasText: 'Bold words' });
  await expect(parent.first()).toBeVisible({ timeout: 10_000 });

  // Typed key by key, so the as-you-type markdown converts it as it would for a user.
  const reply = `${token}t`;
  await sendThreadReply(page, `**thread bold** ${reply}`);
  const replyBubble = threadBubbleWithText(page, reply);
  await expect(replyBubble.locator('b')).toHaveText('thread bold', { timeout: 15_000 });
  await expect(replyBubble).not.toContainText('**');
});

test('a search result shows the message as plain text', async ({ page }) => {
  await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
  await page.locator('.cometchat-conversations__search-bar').first().click();
  await page.locator('.cometchat-search__input input').first().fill(token);
  const result = page.locator('.cometchat-search__messages-list-item').filter({ hasText: token }).first();
  await expect(result).toContainText(PLAIN, { timeout: 20_000 });
  await expect(result).not.toContainText('**');
  await expect(result).not.toContainText('_italic');
});
