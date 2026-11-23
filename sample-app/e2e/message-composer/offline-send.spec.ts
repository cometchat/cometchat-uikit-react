import { test, expect, Page } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER } from '../helpers';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';

/**
 * E2E — sending while offline (catalog P1).
 *
 * A message sent with no network must never silently vanish. How a failed or
 * queued message behaves afterwards belongs to the offline feature and is
 * tested with it.
 */

let group: ThrowawayGroup;

test.beforeEach(async ({ page }) => {
  group = await createThrowawayGroup({ name: `E2E Offline ${Date.now()}` });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Offline start [${Date.now()}]` });
  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name, { expectMessages: true });
});

test.afterEach(async ({ page }) => {
  await page.context().setOffline(false);
  await group.dispose();
});

function composer(page: Page) {
  return page.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
}

async function typeAndSend(page: Page, text: string) {
  await composer(page).click();
  await composer(page).pressSequentially(text);
  await composer(page).press('Enter');
}

function outgoing(page: Page, text: string) {
  return page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper--outgoing').filter({ hasText: text });
}

test('a message typed offline as the first send of the session is not lost', async ({ page }) => {
  const text = `First send offline [${Date.now()}]`;
  await page.context().setOffline(true);
  await typeAndSend(page, text);

  // Either the message shows (pending or failed), or the text stays in the
  // composer — it must not silently disappear.
  await knownIssue(
    'the first send of a session is lost when offline (the send path loads code it can no longer fetch)',
    async () => {
      await expect
        .poll(
          async () =>
            (await outgoing(page, text).count()) > 0 || (await composer(page).innerText()).includes(text),
          { message: 'the offline message vanished: no bubble and the composer was cleared', timeout: 15_000 }
        )
        .toBe(true);
    },
    { intermittent: true }
  );
});
