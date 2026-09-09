import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers';
import { openStrategyChat } from '../helpers';
import { bubbleWithText } from '../helpers/threads';
import {
  STRATEGY_GROUP,
  PRIMARY_UID,
  STRATEGY_PARTICIPANT_UID,
  PIN_MESSAGE_OPTION,
  UNPIN_MESSAGE_OPTION,
  SAVE_MESSAGE_OPTION,
  GENERIC_ERROR_TOAST,
  PERMISSION_DENIED_TOAST,
  PANEL_ERROR_SUBTITLE,
  pinLimitToast,
  clearPinnedMessages,
  sendStrategyMessage,
  pinMessageRest,
  pinnedIndicator,
  clickMessageOption,
  messageOptionVisible,
  unpinMessageUI,
  openPinnedPanel,
  pinnedPanelRow,
  pinnedPanelError,
  pinnedPanelErrorState,
  waitForPinnedListSettled,
  withOffline,
} from '../helpers/pinSave';

/**
 * E2E — Pin message (React)
 *
 * Independent tests: each seeds its own message(s) over REST, and every test
 * starts from an EMPTY pinned list (cleared over REST in beforeEach) because the
 * app's pin limit is low and a leftover pin would poison the next test.
 *
 * The pinned indicator is NOT optimistic — it only appears once the server
 * confirms — so the offline test asserts the indicator never shows.
 */

const PIN_LIMIT = Number(process.env.E2E_PIN_MESSAGES_LIMIT ?? '');

/**
 * Permission-deny flags. Set each to `1` only after you've applied the matching
 * DENY to the **participant** scope in the Strategy group's dashboard settings
 * (see README → Pin & Save prerequisites). Each test self-skips until then,
 * because the deny lives in dashboard config, not in code — an un-configured app
 * would let the action through and fail the test for the wrong reason.
 */
const PARTICIPANT_PIN_DENIED = (process.env.E2E_PARTICIPANT_PIN_DENIED ?? '') === '1';
const PARTICIPANT_UNPIN_DENIED = (process.env.E2E_PARTICIPANT_UNPIN_DENIED ?? '') === '1';
const PARTICIPANT_PIN_LISTING_DENIED =
  (process.env.E2E_PARTICIPANT_PIN_LISTING_DENIED ?? '') === '1';

/** Seed a fresh Strategy message and wait for its bubble. */
async function seedMessage(page: import('@playwright/test').Page, label: string) {
  const text = `${label} [${Date.now()}]`;
  const id = await sendStrategyMessage({ as: PRIMARY_UID, text });
  await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
  return { id, text };
}

test.describe('Pin message', () => {
  test.beforeEach(async ({ page }) => {
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);
    await loginToApp(page);
    await openStrategyChat(page);
  });

  test('offers "Pin message" on an eligible message', async ({ page }) => {
    const { text } = await seedMessage(page, 'Pin option');
    expect(await messageOptionVisible(page, bubbleWithText(page, text), PIN_MESSAGE_OPTION)).toBe(true);
  });

  test('pinning shows the indicator and flips the option to Unpin', async ({ page }) => {
    const { text } = await seedMessage(page, 'Pin me');
    const bubble = bubbleWithText(page, text);

    await clickMessageOption(page, bubble, PIN_MESSAGE_OPTION);
    await expect(pinnedIndicator(bubble)).toBeVisible({ timeout: 10_000 });
    expect(await messageOptionVisible(page, bubble, UNPIN_MESSAGE_OPTION)).toBe(true);
  });

  test('unpinning (via the confirm dialog) clears the indicator', async ({ page }) => {
    const { id, text } = await seedMessage(page, 'Unpin me');
    // Start already pinned so the test is about unpin.
    await pinMessageRest(id, PRIMARY_UID);
    await page.reload();
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(pinnedIndicator(bubble)).toBeVisible({ timeout: 10_000 });

    await unpinMessageUI(page, bubble);
    await expect(pinnedIndicator(bubble)).toHaveCount(0, { timeout: 10_000 });
    expect(await messageOptionVisible(page, bubble, PIN_MESSAGE_OPTION)).toBe(true);
  });

  test('the pinned panel lists a pinned message', async ({ page }) => {
    const { id, text } = await seedMessage(page, 'Panel pin');
    await pinMessageRest(id, PRIMARY_UID);

    await openPinnedPanel(page);
    await expect(pinnedPanelRow(page, text)).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a normal pinned row jumps the main list to it', async ({ page }) => {
    const { id, text } = await seedMessage(page, 'Jump normal');
    await pinMessageRest(id, PRIMARY_UID);
    await openPinnedPanel(page);

    await pinnedPanelRow(page, text).click();
    // Normal jump keeps the panel open and highlights the message in the main list.
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a pinned thread reply opens its thread', async ({ page }) => {
    const parent = await seedMessage(page, 'Thread parent');
    const replyText = `Thread reply [${Date.now()}]`;
    const replyId = await sendStrategyMessage({
      as: PRIMARY_UID,
      text: replyText,
      parentMessageId: parent.id,
    });
    await pinMessageRest(replyId, PRIMARY_UID);

    await openPinnedPanel(page);
    await pinnedPanelRow(page, replyText).click();

    // A pinned reply opens the thread full-width, showing the reply.
    await expect(page.locator('.cometchat-thread-panel').first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('.cometchat-thread-panel').filter({ hasText: replyText }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('a pin that fails offline shows the error toast and no indicator', async ({ page }) => {
    const { text } = await seedMessage(page, 'Offline pin');
    const bubble = bubbleWithText(page, text);

    await withOffline(page, async () => {
      await clickMessageOption(page, bubble, PIN_MESSAGE_OPTION);
      await expect(page.locator('.cometchat-toast__text')).toHaveText(GENERIC_ERROR_TOAST, {
        timeout: 10_000,
      });
    });

    // The indicator is server-confirmed, never optimistic — so it must not appear.
    await expect(pinnedIndicator(bubble)).toHaveCount(0, { timeout: 5_000 });
  });

  test('shows the limit toast when the pin cap is reached', async ({ page }) => {
    test.skip(
      PIN_LIMIT !== 5,
      'Set E2E_PIN_MESSAGES_LIMIT=5 in .env.e2e to run the pin-limit test (only meaningful at a cap of 5).'
    );

    // Fill the cap over REST…
    for (let i = 0; i < 5; i++) {
      const id = await sendStrategyMessage({ as: PRIMARY_UID, text: `Cap filler ${String(i)} [${Date.now()}]` });
      await pinMessageRest(id, PRIMARY_UID);
    }
    // …then try to pin one more from the UI.
    const { text } = await seedMessage(page, 'One too many');
    await clickMessageOption(page, bubbleWithText(page, text), PIN_MESSAGE_OPTION);

    await expect(page.locator('.cometchat-toast__text')).toHaveText(pinLimitToast(5), {
      timeout: 10_000,
    });
    await expect(pinnedIndicator(bubbleWithText(page, text))).toHaveCount(0, { timeout: 5_000 });
  });
});

test.describe('Pin message — permissions', () => {
  // The client no longer gates Pin/Unpin by role — every member sees the option
  // and the SERVER enforces who may act. The first test proves the option is
  // offered to a participant; the rest prove the server's denial surfaces as a
  // toast (or the panel's error state). Those three need the deny actually
  // applied in the dashboard, so they self-skip until the matching env flag is set.

  test('a participant IS offered "Pin message" (the option is no longer role-gated)', async ({
    page,
  }) => {
    // Seed a message as the owner so the participant has something to act on.
    const text = `Participant sees pin [${Date.now()}]`;
    await sendStrategyMessage({ as: PRIMARY_UID, text });

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);

    const bubble = bubbleWithText(page, text);
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    // Both are offered now — Save (personal) and Pin (server-enforced).
    expect(await messageOptionVisible(page, bubble, SAVE_MESSAGE_OPTION)).toBe(true);
    expect(await messageOptionVisible(page, bubble, PIN_MESSAGE_OPTION)).toBe(true);
  });

  test('a denied pin shows the permission toast and does not pin', async ({ page }) => {
    test.skip(
      !PARTICIPANT_PIN_DENIED,
      'Set E2E_PARTICIPANT_PIN_DENIED=1 after denying the participant scope the PIN permission in the Strategy group (see README → Pin & Save prerequisites).'
    );
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);

    const text = `Denied pin [${Date.now()}]`;
    await sendStrategyMessage({ as: PRIMARY_UID, text });

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    // The option is offered; the server rejects the write.
    await clickMessageOption(page, bubble, PIN_MESSAGE_OPTION);
    await expect(page.locator('.cometchat-toast__text')).toHaveText(PERMISSION_DENIED_TOAST, {
      timeout: 10_000,
    });
    // The indicator is server-confirmed, so a denied pin leaves it absent.
    await expect(pinnedIndicator(bubble)).toHaveCount(0, { timeout: 5_000 });
  });

  test('a denied unpin shows the permission toast and stays pinned', async ({ page }) => {
    test.skip(
      !PARTICIPANT_UNPIN_DENIED,
      'Set E2E_PARTICIPANT_UNPIN_DENIED=1 after denying the participant scope the UNPIN permission in the Strategy group (see README → Pin & Save prerequisites).'
    );
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);

    // The owner pins it; the participant will be denied the unpin.
    const text = `Denied unpin [${Date.now()}]`;
    const id = await sendStrategyMessage({ as: PRIMARY_UID, text });
    await pinMessageRest(id, PRIMARY_UID);

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(pinnedIndicator(bubble)).toBeVisible({ timeout: 15_000 });

    await unpinMessageUI(page, bubble); // opens the sheet → Unpin → confirms the dialog
    await expect(page.locator('.cometchat-toast__text')).toHaveText(PERMISSION_DENIED_TOAST, {
      timeout: 10_000,
    });
    // Rejected — it is still pinned.
    await expect(pinnedIndicator(bubble)).toBeVisible({ timeout: 5_000 });
  });

  test('a denied pinned-listing shows the panel error state', async ({ page }) => {
    test.skip(
      !PARTICIPANT_PIN_LISTING_DENIED,
      'Set E2E_PARTICIPANT_PIN_LISTING_DENIED=1 after denying the participant scope the PINNED-MESSAGES LISTING permission in the Strategy group (see README → Pin & Save prerequisites).'
    );
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);

    // There IS a pin, so a working listing would show a row — the error state is
    // therefore unambiguously the denial, not an empty list.
    const text = `Listing denied [${Date.now()}]`;
    const id = await sendStrategyMessage({ as: PRIMARY_UID, text });
    await pinMessageRest(id, PRIMARY_UID);

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });

    await openPinnedPanel(page);
    // The denied fetch routes to the generic error state, not the pinned row.
    await expect(pinnedPanelError(page)).toHaveText(PANEL_ERROR_SUBTITLE, { timeout: 10_000 });
    await expect(pinnedPanelRow(page, text)).toHaveCount(0);
  });

  // ── Permutations across the deny flags ────────────────────────────────────
  // Each needs a specific ALLOWED/DENIED mix, so they self-skip unless that exact
  // combination is configured — the full matrix spans more than one env setup.

  test('a denied listing does not append a realtime pin', async ({ page }) => {
    test.skip(
      PARTICIPANT_PIN_DENIED || !PARTICIPANT_PIN_LISTING_DENIED,
      'Requires pin ALLOWED and listing DENIED — leave E2E_PARTICIPANT_PIN_DENIED unset and set E2E_PARTICIPANT_PIN_LISTING_DENIED=1.'
    );
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);

    const text = `Realtime pin, denied listing [${Date.now()}]`;
    await sendStrategyMessage({ as: PRIMARY_UID, text });

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    // First: the panel is in the error state (listing denied).
    await openPinnedPanel(page);
    await expect(pinnedPanelErrorState(page)).toBeVisible({ timeout: 10_000 });

    // Then: pin from the FRONTEND message option (allowed) — a real pin that
    // broadcasts to the OPEN panel, which must not append it into an errored list.
    await clickMessageOption(page, bubble, PIN_MESSAGE_OPTION);
    await page.waitForTimeout(2500);

    // Still errored, no row leaked in.
    await expect(pinnedPanelErrorState(page)).toBeVisible();
    await expect(pinnedPanelError(page)).toHaveText(PANEL_ERROR_SUBTITLE);
    await expect(pinnedPanelRow(page, text)).toHaveCount(0);
  });

  test('a denied pin never reaches the (allowed) pinned list', async ({ page }) => {
    test.skip(
      !PARTICIPANT_PIN_DENIED || PARTICIPANT_PIN_LISTING_DENIED,
      'Requires pin DENIED and listing ALLOWED — set E2E_PARTICIPANT_PIN_DENIED=1 and leave E2E_PARTICIPANT_PIN_LISTING_DENIED unset.'
    );
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);

    const text = `Denied pin, allowed listing [${Date.now()}]`;
    await sendStrategyMessage({ as: PRIMARY_UID, text });

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    // First: open the panel and wait until it has loaded (shimmer gone, not
    // errored). Don't assert on rows — an allowed-but-empty list is valid.
    await openPinnedPanel(page);
    await waitForPinnedListSettled(page);

    // Then: pin from the FRONTEND message option — the server rejects it.
    await clickMessageOption(page, bubble, PIN_MESSAGE_OPTION);
    await expect(page.locator('.cometchat-toast__text')).toHaveText(PERMISSION_DENIED_TOAST, {
      timeout: 10_000,
    });
    await page.waitForTimeout(2500);

    // The denied pin produced no row and did not flip the list to error.
    await expect(pinnedPanelErrorState(page)).toHaveCount(0);
    await expect(pinnedPanelRow(page, text)).toHaveCount(0);
  });

  test('a denied unpin does not remove the message from the OPEN pinned list (realtime)', async ({
    page,
  }) => {
    test.skip(
      !PARTICIPANT_UNPIN_DENIED || PARTICIPANT_PIN_DENIED || PARTICIPANT_PIN_LISTING_DENIED,
      'Requires unpin DENIED with pin and listing ALLOWED — set E2E_PARTICIPANT_UNPIN_DENIED=1 and leave E2E_PARTICIPANT_PIN_DENIED and E2E_PARTICIPANT_PIN_LISTING_DENIED unset.'
    );
    await clearPinnedMessages(STRATEGY_GROUP, PRIMARY_UID);

    const text = `Participant pins, unpin denied [${Date.now()}]`;
    await sendStrategyMessage({ as: PRIMARY_UID, text });

    await loginToApp(page, STRATEGY_PARTICIPANT_UID);
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    // The participant pins it themselves (pin allowed).
    await clickMessageOption(page, bubble, PIN_MESSAGE_OPTION);
    await expect(pinnedIndicator(bubble)).toBeVisible({ timeout: 10_000 });

    // First: open the pinned list and wait until it shows the row.
    await openPinnedPanel(page);
    await waitForPinnedListSettled(page);
    await expect(pinnedPanelRow(page, text)).toBeVisible({ timeout: 10_000 });

    // Then: attempt the unpin from the frontend — denied. With the list OPEN,
    // the denied unpin must NOT remove the row in realtime (no server-confirmed
    // unpin event ever arrives).
    await unpinMessageUI(page, bubble);
    await expect(page.locator('.cometchat-toast__text')).toHaveText(PERMISSION_DENIED_TOAST, {
      timeout: 10_000,
    });
    await page.waitForTimeout(2500);

    await expect(pinnedPanelRow(page, text)).toBeVisible();
    await expect(pinnedIndicator(bubble)).toBeVisible();
  });
});
