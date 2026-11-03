import { test, expect } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { visibleWithin } from '../helpers/wait';
import { openActionSheet } from '../helpers/threads';
import {
  bubblesContaining,
  conversationRow,
  newSession,
  openChatsTab,
  openGroupChat,
  sendFromComposer,
  unreadBadge,
} from './journey-helpers';

/**
 * Journey 2 — the same user in two tabs (or on two devices).
 *
 * Tab A acts; tab B must follow without a reload: a message sent in A shows
 * once in B, a message from someone else shows once in both, reading in A
 * clears the unread count in B, and an edit or delete in A reaches B.
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Two tabs ${Date.now()}` });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Two tabs start [${Date.now()}]` });
});

test.afterEach(async () => {
  await group.dispose();
});

test('a second tab of the same user stays in sync', async ({ page: tabA, browser }) => {
  test.setTimeout(240_000);
  const tag = Date.now();
  const tabB = await newSession(browser, PRIMARY_USER);
  try {
    await loginToApp(tabA);
    await openGroupChat(tabA, group.name);
    await openGroupChat(tabB, group.name);

    const mine = `Sent from tab A [${tag}]`;
    await test.step('a message sent in tab A appears once in tab B', async () => {
      await sendFromComposer(tabA, mine);
      await expect(bubblesContaining(tabB, mine)).toHaveCount(1, { timeout: 15_000 });
      await expect(bubblesContaining(tabA, mine)).toHaveCount(1);
    });

    await test.step("someone else's message appears once in both tabs", async () => {
      const theirs = `From Bob [${tag}]`;
      await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: theirs });
      await expect(bubblesContaining(tabA, theirs)).toHaveCount(1, { timeout: 15_000 });
      await expect(bubblesContaining(tabB, theirs)).toHaveCount(1, { timeout: 15_000 });
    });

    await test.step('an edit made in tab A reaches tab B', async () => {
      const edited = `Edited in tab A [${tag}]`;
      await openActionSheet(tabA, bubblesContaining(tabA, mine).last());
      await tabA.getByRole('menuitem', { name: 'Edit', exact: true }).click();
      const input = tabA.locator('.cometchat-messages-wrapper .cometchat-message-composer [contenteditable="true"]').first();
      await input.press('ControlOrMeta+a');
      await input.pressSequentially(edited);
      await input.press('Enter');

      await expect(bubblesContaining(tabB, edited)).toHaveCount(1, { timeout: 15_000 });
    });

    await test.step('a delete made in tab A reaches tab B', async () => {
      const doomed = `Delete me in tab A [${tag}]`;
      await sendFromComposer(tabA, doomed);
      await expect(bubblesContaining(tabB, doomed)).toHaveCount(1, { timeout: 15_000 });

      await openActionSheet(tabA, bubblesContaining(tabA, doomed).last());
      await tabA.getByRole('menuitem', { name: 'Delete', exact: true }).click();
      const confirm = tabA.locator('.cometchat-confirm-dialog__actions-confirm button').first();
      // Deleting may ask for confirmation, depending on configuration.
      if (await visibleWithin(confirm, 3_000)) await confirm.click();

      await expect(bubblesContaining(tabB, doomed)).toHaveCount(0, { timeout: 15_000 });
    });
    // Last, so a known issue here doesn't stop the edit and delete checks above.
    await test.step('reading in tab A clears the unread count in tab B', async () => {
      await openChatsTab(tabA);
      await openChatsTab(tabB);
      await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: `Unread for both [${tag}]` });
      await expect(unreadBadge(conversationRow(tabB, group.name))).toBeVisible({ timeout: 15_000 });

      await conversationRow(tabA, group.name).click();
      await knownIssue('reading a chat in one tab leaves its unread badge in the other tab', async () => {
        await expect(unreadBadge(conversationRow(tabB, group.name))).toHaveCount(0, { timeout: 20_000 });
      });
      await conversationRow(tabB, group.name).click();
    });

  } finally {
    await tabB.context().close();
  }
});
