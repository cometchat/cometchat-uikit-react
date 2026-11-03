import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { CALLEE, CALLER, MEDIA_ARGS, MEDIA_PERMISSIONS, newCallSession, startCall } from '../helpers/calls';

/**
 * E2E — the incoming call screen (catalog K3).
 *
 * Charlie calls Diana from his own browser session while Diana sits on her
 * conversation list. Neither user backs a read-only fixture, so the call
 * messages these tests leave behind don't disturb other suites. Chromium's fake
 * camera and microphone stand in for real devices, so a call can be accepted
 * headless.
 */

test.use({ launchOptions: { args: MEDIA_ARGS }, permissions: MEDIA_PERMISSIONS });

const startVoiceCall = (caller: Page) => startCall(caller, CALLEE.name, 'voice');

test.describe('Incoming call (K3)', () => {
  let caller: Page;

  test.beforeEach(async ({ page, browser }) => {
    caller = await newCallSession(browser);
    await loginToApp(page, CALLEE.uid);
    await loginToApp(caller, CALLER.uid);
  });

  test.afterEach(async () => {
    // Never leave a call ringing for the next test.
    const cancel = caller.locator('.cometchat-outgoing-call__button').first();
    if (await cancel.isVisible()) await cancel.click();
    await caller.context().close();
  });

  test("shows the caller's name with accept and decline", async ({ page }) => {
    await startVoiceCall(caller);

    const incoming = page.locator('.cometchat-incoming-call').first();
    await expect(incoming).toBeVisible({ timeout: 20_000 });
    await expect(incoming.locator('.cometchat-incoming-call__title')).toContainText(CALLER.name);
    await expect(incoming.locator('.cometchat-incoming-call__button-accept')).toBeVisible();
    await expect(incoming.locator('.cometchat-incoming-call__button-decline')).toBeVisible();
  });

  test('declining closes the call on both sides', async ({ page }) => {
    await startVoiceCall(caller);

    const incoming = page.locator('.cometchat-incoming-call').first();
    await expect(incoming).toBeVisible({ timeout: 20_000 });
    await incoming.locator('.cometchat-incoming-call__button-decline').click();

    await expect(incoming).toBeHidden({ timeout: 10_000 });
    await expect(caller.locator('.cometchat-outgoing-call')).toBeHidden({ timeout: 15_000 });
  });

  test('the incoming call disappears when the caller cancels', async ({ page }) => {
    await startVoiceCall(caller);

    const incoming = page.locator('.cometchat-incoming-call').first();
    await expect(incoming).toBeVisible({ timeout: 20_000 });
    await caller.locator('.cometchat-outgoing-call__button').first().click();

    await expect(incoming).toBeHidden({ timeout: 15_000 });
  });

  test('accepting opens the ongoing call for both users', async ({ page }) => {
    await startVoiceCall(caller);

    const incoming = page.locator('.cometchat-incoming-call').first();
    await expect(incoming).toBeVisible({ timeout: 20_000 });
    await incoming.locator('.cometchat-incoming-call__button-accept').click();

    await expect(incoming).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('.cometchat-ongoing-call').first()).toBeVisible({ timeout: 30_000 });
    await expect(caller.locator('.cometchat-ongoing-call').first()).toBeVisible({ timeout: 30_000 });
  });
});
