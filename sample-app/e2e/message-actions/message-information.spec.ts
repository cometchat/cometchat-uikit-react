import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, createThrowawayUser, ThrowawayGroup, ThrowawayUser } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { sendMessageToGroup } from '../helpers/pinSave';
import { bubbleWithText, openActionSheet } from '../helpers/threads';

/**
 * Message information in a group (catalog E5): per-member receipts. Bob opens
 * the chat in his own session and reads the message; a second member never logs
 * in. The panel lists members who have a receipt, so Bob shows as read and the
 * absent member isn't listed as having read it.
 */

let group: ThrowawayGroup;
let absent: ThrowawayUser;

test.beforeEach(async () => {
  absent = await createThrowawayUser({ name: `E2E Absent ${Date.now()}` });
  group = await createThrowawayGroup({ name: `E2E Receipts ${Date.now()}`, members: [SECONDARY_USER, absent.uid] });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Receipts start [${Date.now()}]` });
});

test.afterEach(async () => {
  await group.dispose();
  await absent.dispose();
});

test('message information shows who has read the message and who has not', async ({ page, browser }) => {
  test.setTimeout(180_000);
  const text = `Who read this? [${Date.now()}]`;
  const bobContext = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const bob = await bobContext.newPage();
  try {
    await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text });

    // Bob reads it.
    await loginToApp(bob, SECONDARY_USER);
    await selectGroupByName(bob, group.name);
    await waitForChatOpen(bob, group.name, { expectMessages: true });
    await expect(bubbleWithText(bob, text)).toBeVisible({ timeout: 15_000 });

    await loginToApp(page);
    await selectGroupByName(page, group.name);
    await waitForChatOpen(page, group.name, { expectMessages: true });
    await openActionSheet(page, bubbleWithText(page, text));
    await page.getByRole('menuitem', { name: 'Info', exact: true }).click();

    const info = page.getByRole('dialog', { name: 'Message Information' });
    await expect(info).toBeVisible({ timeout: 10_000 });
    const row = (name: string) => info.locator('.cometchat-message-information__user-item').filter({ hasText: name });
    await expect(row('Bob Smith')).toContainText('Read', { timeout: 20_000 });
    await expect(row(absent.name)).toHaveCount(0);
  } finally {
    await bobContext.close();
  }
});
