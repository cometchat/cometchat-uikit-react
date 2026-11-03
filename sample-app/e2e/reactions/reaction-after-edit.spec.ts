import { test, expect } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { addReaction, sendMessageToGroup } from '../helpers/pinSave';
import { openActionSheet } from '../helpers/threads';
import { bubblesContaining, composerInput, conversationRow, HEADER_TITLE, openChatsTab } from '../journeys/journey-helpers';

/**
 * Editing a message must not change its reactions: your own reaction stays
 * "reacted by me" after the edit lands. (Known issue — today it flips off
 * a few seconds after the edit, though the server keeps reactedByMe: true.)
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Reaction edit ${Date.now()}` });
});

test.afterEach(async () => {
  await group.dispose();
});

test('your reaction stays yours after you edit the message', async ({ page }) => {
  const tag = Date.now();
  const original = `Before edit [${tag}]`;
  const edited = `After edit [${tag}]`;
  const id = await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: original });
  await addReaction(id, '😀', PRIMARY_USER);

  await loginToApp(page);
  await openChatsTab(page);
  await conversationRow(page, group.name).click();
  await expect(page.locator(HEADER_TITLE).first()).toContainText(group.name, { timeout: 15_000 });
  const mine = (text: string) => bubblesContaining(page, text).locator('.cometchat-reactions__chip--active');
  await expect(mine(original)).toHaveCount(1, { timeout: 15_000 });

  await openActionSheet(page, bubblesContaining(page, original).last());
  await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  await composerInput(page).press('ControlOrMeta+a');
  await composerInput(page).pressSequentially(edited);
  await composerInput(page).press('Enter');
  await expect(bubblesContaining(page, edited)).toHaveCount(1, { timeout: 15_000 });

  // The bug flips the state a few seconds after the edit, so watch an 8 s window
  // for the flip (this poll "succeeds" early only if the state is lost), then
  // assert the state is still there.
  await expect
    .poll(() => mine(edited).count(), { intervals: [1_000], timeout: 8_000, message: 'reaction lost its "mine" state' })
    .toBe(0)
    .catch(() => undefined);
  await knownIssue(
    'editing a message clears "reacted by me" on its reactions a few seconds later',
    async () => {
      await expect(mine(edited), 'your reaction lost its "reacted by me" state after the edit').toHaveCount(1);
    },
    { intermittent: true }
  );
});
