import { Browser, Locator, Page, expect, test } from '@playwright/test';
import { TEST_USERS } from './auth';

/**
 * Calls between two (or more) browser sessions. Chromium's fake camera and microphone stand in
 * for real devices, so a call can be placed, accepted and run headless.
 */

export const MEDIA_ARGS = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
export const MEDIA_PERMISSIONS = ['microphone', 'camera'];

/** Charlie and Diana: neither backs a read-only fixture, so their call history can grow. */
export const CALLER = { uid: TEST_USERS.tertiary, name: 'Charlie Brown' };
export const CALLEE = { uid: 'e2e-user-4', name: 'Diana Prince' };

/** Another session (another person's browser) with camera and microphone allowed. */
export async function newCallSession(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    permissions: MEDIA_PERMISSIONS,
  });
  return context.newPage();
}

/** The open chat's voice or video call button, in its header. */
export function callButton(page: Page, kind: 'voice' | 'video'): Locator {
  const selector =
    kind === 'voice'
      ? '.cometchat-call-buttons__voice, button[aria-label*="Voice" i], button[aria-label*="Audio" i]'
      : '.cometchat-call-buttons__video, button[aria-label*="Video" i]';
  return page.locator('.cometchat-messages-wrapper').locator(selector).first();
}

/** Open the 1:1 chat with `calleeName` from the Users tab and start a voice or video call. */
export async function startCall(caller: Page, calleeName: string, kind: 'voice' | 'video' = 'voice') {
  await caller.locator('.cometchat-tab-component__tab:has-text("Users")').first().click();
  const callee = caller.locator('.cometchat-users__item').filter({ hasText: calleeName }).first();
  await expect(callee).toBeVisible({ timeout: 30_000 });
  await callee.click();
  await expect(caller.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first()).toContainText(
    calleeName,
    { timeout: 15_000 }
  );
  await callButton(caller, kind).click();
  await expect(caller.locator('.cometchat-outgoing-call').first()).toBeVisible({ timeout: 15_000 });
}

/** Accept the incoming call on `callee` and wait until both sides are in the call. */
export async function acceptCall(callee: Page, caller: Page) {
  const incoming = callee.locator('.cometchat-incoming-call').first();
  await expect(incoming).toBeVisible({ timeout: 20_000 });
  await incoming.locator('.cometchat-incoming-call__button-accept').click();
  await expect(ongoingCall(callee)).toBeVisible({ timeout: 30_000 });
  await expect(ongoingCall(caller)).toBeVisible({ timeout: 30_000 });
}

export const ongoingCall = (page: Page) => page.locator('.cometchat-ongoing-call').first();

/** The call's own controls (rendered by the Calls SDK inside the ongoing-call screen). */
export const callControls = (page: Page) => ({
  microphone: ongoingCall(page).getByTestId('cometchat-audio-toggle-button'),
  camera: ongoingCall(page).getByTestId('cometchat-video-toggle-button'),
  leave: ongoingCall(page).locator('.cometchat-calls-control-button--call-end'),
});

/** A participant's tile, found by the per-participant options button the SDK labels with their name. */
export const participantTile = (page: Page, name: string) =>
  ongoingCall(page).getByRole('button', { name: `More options for ${name}` });
