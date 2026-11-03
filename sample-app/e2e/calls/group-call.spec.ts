import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import {
  CALLEE,
  CALLER,
  MEDIA_ARGS,
  MEDIA_PERMISSIONS,
  callButton,
  callControls,
  newCallSession,
  ongoingCall,
  participantTile,
} from '../helpers/calls';

/**
 * E2E — a group call (catalog K5).
 *
 * In a throwaway group, Charlie starts a video call from the header, which posts a call
 * message with a Join button. Diana joins from it, both see each other, and when she leaves
 * the call carries on for Charlie without her.
 */

test.use({ launchOptions: { args: MEDIA_ARGS }, permissions: MEDIA_PERMISSIONS });

let group: ThrowawayGroup;
let starter: Page;

test.beforeEach(async ({ browser }) => {
  group = await createThrowawayGroup({ name: `E2E Group call ${Date.now()}`, owner: CALLER.uid, members: [CALLEE.uid] });
  starter = await newCallSession(browser);
  await loginToApp(starter, CALLER.uid);
});

test.afterEach(async ({ page }) => {
  for (const p of [page, starter]) {
    const { leave } = callControls(p);
    if (await leave.isVisible().catch(() => false)) await leave.click();
  }
  await starter.context().close();
  await group.dispose();
});

async function openGroup(page: Page) {
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name);
}

test('a member joins a group call from its message, and leaving keeps it going for the rest', async ({ page }) => {
  await test.step('Charlie starts a video call in the group', async () => {
    await openGroup(starter);
    await callButton(starter, 'video').click();
    await expect(ongoingCall(starter)).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Diana joins from the call message', async () => {
    await loginToApp(page, CALLEE.uid);
    await openGroup(page);
    const join = page
      .locator('.cometchat-messages-wrapper .cometchat-call-bubble')
      .last()
      .getByRole('button', { name: 'Join' });
    await expect(join).toBeVisible({ timeout: 20_000 });
    await join.click();
    await expect(ongoingCall(page)).toBeVisible({ timeout: 30_000 });
    await expect(participantTile(page, CALLER.name)).toBeAttached({ timeout: 20_000 });
    await expect(participantTile(starter, CALLEE.name)).toBeAttached({ timeout: 20_000 });
  });

  await test.step('Diana leaves; Charlie stays in the call without her', async () => {
    await callControls(page).leave.click();
    await expect(ongoingCall(page)).toBeHidden({ timeout: 15_000 });
    await expect(participantTile(starter, CALLEE.name)).toHaveCount(0, { timeout: 20_000 });
    await expect(ongoingCall(starter)).toBeVisible();
  });
});
