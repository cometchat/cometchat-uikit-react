import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { restBase, sendMessageToGroup, userHeaders } from '../helpers/pinSave';
import { openConversationFromList } from '../helpers/navigation';
import { bubbleWithText, openActionSheet } from '../helpers/threads';

/**
 * Mark as unread (catalog E7): marking a received message unread shows the
 * "new messages" divider, marks the conversation unread in the list and on the
 * server, and opening the chat again clears it.
 */

const HEADER_TITLE = '.cometchat-messages-wrapper .cometchat-message-header__title';

let marked: ThrowawayGroup;
let other: ThrowawayGroup;

test.beforeEach(async () => {
  marked = await createThrowawayGroup({ name: `E2E Unread mark ${Date.now()}` });
  other = await createThrowawayGroup({ name: `E2E Unread other ${Date.now()}` });
  await sendMessageToGroup({ guid: other.guid, as: PRIMARY_USER, text: `Other [${Date.now()}]` });
});

test.afterEach(async () => {
  await marked.dispose();
  await other.dispose();
});

async function serverUnread(guid: string): Promise<number> {
  const res = await fetch(`${restBase()}/users/${PRIMARY_USER}/conversations/group_${guid}`, {
    headers: userHeaders(PRIMARY_USER),
  });
  return Number(((await res.json()) as { data?: { unreadMessageCount?: number | string } }).data?.unreadMessageCount ?? 0);
}

test('marking a message unread marks the conversation unread until it is opened again', async ({ page }) => {
  const text = `Mark me unread [${Date.now()}]`;
  await sendMessageToGroup({ guid: marked.guid, as: PRIMARY_USER, text: `Earlier [${Date.now()}]` });
  await sendMessageToGroup({ guid: marked.guid, as: SECONDARY_USER, text });

  await loginToApp(page);
  const row = (name: string) => page.locator('.cometchat-conversations__item').filter({ hasText: name }).first();
  const badge = (name: string) => row(name).locator('.cometchat-conversations__item-unread-badge');

  await openConversationFromList(page, marked.name);
  await expect(badge(marked.name)).toHaveCount(0, { timeout: 15_000 });

  await openActionSheet(page, bubbleWithText(page, text));
  await page.getByRole('menuitem', { name: 'Mark Unread' }).click();
  await expect(page.locator('.cometchat-message-list__new-message-divider').first()).toBeVisible({ timeout: 5_000 });
  await expect.poll(() => serverUnread(marked.guid), { timeout: 15_000 }).toBeGreaterThan(0);

  // Leave the chat: its row now shows as unread.
  await row(other.name).click();
  await expect(page.locator(HEADER_TITLE).first()).toContainText(other.name, { timeout: 15_000 });
  await expect(badge(marked.name)).toBeVisible({ timeout: 15_000 });

  // Opening it again reads it.
  await row(marked.name).click();
  await expect(page.locator(HEADER_TITLE).first()).toContainText(marked.name, { timeout: 15_000 });
  await expect(badge(marked.name)).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(() => serverUnread(marked.guid), { timeout: 15_000 }).toBe(0);
});
