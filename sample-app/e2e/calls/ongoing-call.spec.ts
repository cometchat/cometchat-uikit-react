import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import {
  CALLEE,
  CALLER,
  MEDIA_ARGS,
  MEDIA_PERMISSIONS,
  acceptCall,
  callControls,
  newCallSession,
  ongoingCall,
  participantTile,
  startCall,
} from '../helpers/calls';

/**
 * E2E — an ongoing 1:1 call (catalog K4) and the call message it leaves behind (K6).
 *
 * Charlie video-calls Diana from his own session and she accepts; both are in the call with
 * fake media. The microphone and camera toggles change state and say so, and leaving ends
 * the call for both, after which their chat records it.
 */

test.use({ launchOptions: { args: MEDIA_ARGS }, permissions: MEDIA_PERMISSIONS });

let caller: Page;

test.beforeEach(async ({ page, browser }) => {
  caller = await newCallSession(browser);
  await loginToApp(page, CALLEE.uid);
  await loginToApp(caller, CALLER.uid);
  await startCall(caller, CALLEE.name, 'video');
  await acceptCall(page, caller);
});

test.afterEach(async ({ page }) => {
  // Never leave a call running for the next test.
  for (const p of [page, caller]) {
    const { leave } = callControls(p);
    if (await leave.isVisible().catch(() => false)) await leave.click();
  }
  await caller.context().close();
});

test('both participants are in the call', async ({ page }) => {
  await expect(participantTile(page, CALLER.name)).toBeAttached({ timeout: 15_000 });
  await expect(participantTile(caller, CALLEE.name)).toBeAttached({ timeout: 15_000 });
});

test('the microphone toggle mutes and unmutes, and says which', async ({ page }) => {
  const { microphone } = callControls(page);
  await expect(microphone).toHaveAttribute('aria-label', 'Mute microphone', { timeout: 15_000 });
  await microphone.click();
  await expect(microphone).toHaveAttribute('aria-label', 'Unmute microphone', { timeout: 10_000 });
  await microphone.click();
  await expect(microphone).toHaveAttribute('aria-label', 'Mute microphone', { timeout: 10_000 });
});

test('the camera toggle turns the camera off and on, and says which', async ({ page }) => {
  const { camera } = callControls(page);
  await expect(camera).toHaveAttribute('aria-label', 'Turn off camera', { timeout: 15_000 });
  await camera.click();
  await expect(camera).toHaveAttribute('aria-label', 'Turn on camera', { timeout: 10_000 });
  await camera.click();
  await expect(camera).toHaveAttribute('aria-label', 'Turn off camera', { timeout: 10_000 });
});

test('leaving ends the call for both, and the chat records it', async ({ page }) => {
  await callControls(page).leave.click();
  await expect(ongoingCall(page)).toBeHidden({ timeout: 15_000 });
  await expect(ongoingCall(caller)).toBeHidden({ timeout: 15_000 });

  // Charlie's chat with Diana is still open; its latest message is the ended call.
  const lastAction = caller.locator('.cometchat-messages-wrapper .cometchat-action-bubble').last();
  await expect(lastAction).toContainText(/call ended/i, { timeout: 15_000 });
});
