import { Page, expect } from '@playwright/test';

/**
 * Browser-side helpers for the agentic group chat tests (ENG-36495).
 *
 * Agent replies render as `assistant`-type bubbles inside the normal group
 * message list — root class `.cometchat-ai-assistant-bubble`.
 */

/** Selector for an agent reply bubble inside the message list. */
export const AGENT_BUBBLE = '.cometchat-ai-assistant-bubble';

/** Selector for a single message wrapper (one per message in the list). */
const MESSAGE_WRAPPER = '.cometchat-message-bubble__wrapper';

/**
 * Wait for the agent to reply to the message you just sent, then return.
 *
 * A genuine reply is always the LAST message in the list (it arrives after your
 * message). We assert on the last wrapper instead of counting all agent bubbles
 * so historical replies — which are lazy-loaded and mount a beat after the group
 * opens — can never produce a false positive.
 *
 * Resolves as soon as the reply appears; throws (fails the test) if none arrives
 * within `timeout`. Default 120s — agent latency commonly exceeds 60s, especially
 * for back-to-back requests. It returns the moment the reply lands, so a fast
 * reply doesn't pay the full wait.
 */
export async function waitForAgentReply(page: Page, timeout = 120_000): Promise<void> {
  await expect
    .poll(
      () => page.locator(MESSAGE_WRAPPER).last().locator(AGENT_BUBBLE).count(),
      { timeout, message: `No agent reply arrived within ${timeout / 1000}s` }
    )
    .toBeGreaterThan(0);
}

/**
 * Assert that NO agent replies within `waitMs` (default 30s).
 *
 * For the multi-agent group, where an agent must be @mentioned to respond.
 * Waits the full window, then verifies the last message is still your own
 * outgoing message (not an agent bubble). Passes if no reply came; fails if one did.
 */
export async function expectNoAgentReply(page: Page, waitMs = 30_000): Promise<void> {
  await page.waitForTimeout(waitMs);
  const lastWrapper = page.locator(MESSAGE_WRAPPER).last();
  await expect(lastWrapper).toHaveClass(/cometchat-message-bubble__wrapper--outgoing/);
  expect(await lastWrapper.locator(AGENT_BUBBLE).count()).toBe(0);
}

/** REST: resolve a user's display name by UID (used to @mention an agent). */
export async function getUserName(uid: string): Promise<string | null> {
  const appId = process.env.COMETCHAT_APP_ID ?? '';
  const region = process.env.COMETCHAT_REGION ?? 'us';
  const apiKey = process.env.COMETCHAT_API_KEY ?? '';
  const res = await fetch(`https://${appId}.api-${region}.cometchat.io/v3/users/${uid}`, {
    headers: { 'Content-Type': 'application/json', apikey: apiKey, appid: appId },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data?.name ?? null;
}

/** Open a group chat from the Groups tab by its display name. */
export async function openGroupByName(page: Page, name: string): Promise<void> {
  const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
  await groupsTab.click();
  await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });

  const group = page.locator('.cometchat-groups__item').filter({ hasText: name }).first();
  await expect(group).toBeVisible({ timeout: 10_000 });
  await group.click();

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForSelector('.cometchat-message-composer', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/** Type a plain message into the composer and send it. */
export async function sendComposerMessage(page: Page, text: string): Promise<void> {
  const composer = page.locator('.cometchat-message-composer').first();
  const input = composer.locator('[contenteditable="true"]').first();
  await input.click();
  await page.keyboard.type(text);

  const sendBtn = composer
    .locator('[class*="send-button"], button[aria-label*="Send" i]')
    .first();
  await sendBtn.click();
}

/**
 * Insert an @mention for the given display name via the mentions picker, then
 * append `suffix` and send. Picks the suggestion whose row matches `name`,
 * falling back to the first suggestion.
 */
export async function sendMentionMessage(
  page: Page,
  name: string,
  suffix: string
): Promise<void> {
  const composer = page.locator('.cometchat-message-composer').first();
  const input = composer.locator('[contenteditable="true"]').first();
  await input.click();

  // Type '@' + the first token of the name to filter the picker.
  const firstToken = name.split(/\s+/)[0] ?? name;
  await page.keyboard.type(`@${firstToken}`);
  await page.waitForTimeout(1500);

  const dropdown = page.locator('.cometchat-message-composer__mentions-list').first();
  await expect(dropdown).toBeVisible({ timeout: 5_000 });

  const match = dropdown.locator('.cometchat-group-members__item').filter({ hasText: name }).first();
  const suggestion = (await match.count()) > 0
    ? match
    : dropdown.locator('.cometchat-group-members__item').first();
  await expect(suggestion).toBeVisible({ timeout: 3_000 });
  await suggestion.click();
  await page.waitForTimeout(500);

  await page.keyboard.type(suffix);

  const sendBtn = composer
    .locator('[class*="send-button"], button[aria-label*="Send" i]')
    .first();
  await sendBtn.click();
}
