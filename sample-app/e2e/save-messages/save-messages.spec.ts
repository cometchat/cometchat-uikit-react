import { test, expect } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';
import { bubbleWithText } from '../helpers/threads';
import {
  PRIMARY_UID,
  SAVE_MESSAGE_OPTION,
  UNSAVE_MESSAGE_OPTION,
  GENERIC_ERROR_TOAST,
  clearSavedMessages,
  sendStrategyMessage,
  sendMessageToGroup,
  resolveGroupGuid,
  saveMessageRest,
  savedIndicator,
  clickMessageOption,
  unsaveMessageUI,
  messageOptionVisible,
  openSavedScreen,
  savedScreenRow,
  withOffline,
} from '../helpers/pinSave';

/**
 * E2E — Save message (React)
 *
 * Mirrors the pin suite: independent tests, each seeding its own message(s) over
 * REST, with the saved list cleared over REST in beforeEach so no leftover save
 * bleeds across tests. Save is personal (no role gate) and spans every
 * conversation — there is no limit test here.
 */

async function seedMessage(page: import('@playwright/test').Page, label: string) {
  const text = `${label} [${Date.now()}]`;
  const id = await sendStrategyMessage({ as: PRIMARY_UID, text });
  await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
  return { id, text };
}

test.describe('Save message', () => {
  test.beforeEach(async ({ page }) => {
    await clearSavedMessages(PRIMARY_UID);
    await loginToApp(page);
    await openStrategyChat(page);
  });

  test('offers "Save message" on a message', async ({ page }) => {
    const { text } = await seedMessage(page, 'Save option');
    expect(await messageOptionVisible(page, bubbleWithText(page, text), SAVE_MESSAGE_OPTION)).toBe(true);
  });

  test('saving shows the indicator and flips the option to Unsave', async ({ page }) => {
    const { text } = await seedMessage(page, 'Save me');
    const bubble = bubbleWithText(page, text);

    await clickMessageOption(page, bubble, SAVE_MESSAGE_OPTION);
    await expect(savedIndicator(bubble)).toBeVisible({ timeout: 10_000 });
    expect(await messageOptionVisible(page, bubble, UNSAVE_MESSAGE_OPTION)).toBe(true);
  });

  test('unsaving clears the indicator', async ({ page }) => {
    const { id, text } = await seedMessage(page, 'Unsave me');
    await saveMessageRest(id, PRIMARY_UID);
    await page.reload();
    await openStrategyChat(page);
    const bubble = bubbleWithText(page, text);
    await expect(savedIndicator(bubble)).toBeVisible({ timeout: 10_000 });

    await unsaveMessageUI(page, bubble); // unsave is gated behind a confirm dialog
    await expect(savedIndicator(bubble)).toHaveCount(0, { timeout: 10_000 });
    expect(await messageOptionVisible(page, bubble, SAVE_MESSAGE_OPTION)).toBe(true);
  });

  test('the saved screen lists a saved message', async ({ page }) => {
    const { id, text } = await seedMessage(page, 'Saved screen');
    await saveMessageRest(id, PRIMARY_UID);

    await openSavedScreen(page);
    await expect(savedScreenRow(page, text)).toBeVisible({ timeout: 10_000 });
  });

  test('saves from different conversations all appear in the saved screen', async ({ page }) => {
    // One in the Strategy group…
    const groupText = `Saved in Strategy [${Date.now()}]`;
    const groupId = await sendStrategyMessage({ as: PRIMARY_UID, text: groupText });
    await saveMessageRest(groupId, PRIMARY_UID);

    // …and one in the Engineering group (a different conversation; Bob is read-only).
    const engText = `Saved in Engineering [${Date.now()}]`;
    const engineering = await resolveGroupGuid('Engineering');
    const engId = await sendMessageToGroup({ guid: engineering, as: PRIMARY_UID, text: engText });
    await saveMessageRest(engId, PRIMARY_UID);

    await openSavedScreen(page);
    await expect(savedScreenRow(page, groupText)).toBeVisible({ timeout: 10_000 });
    await expect(savedScreenRow(page, engText)).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a saved row opens its source conversation', async ({ page }) => {
    // Save a message in the Engineering group, then reach it from the saved screen.
    const engText = `Open from saved [${Date.now()}]`;
    const engineering = await resolveGroupGuid('Engineering');
    const engId = await sendMessageToGroup({ guid: engineering, as: PRIMARY_UID, text: engText });
    await saveMessageRest(engId, PRIMARY_UID);

    await openSavedScreen(page);
    await savedScreenRow(page, engText).click();

    // Lands in the source conversation with the message shown.
    await expect(bubbleWithText(page, engText)).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a saved thread reply opens its thread', async ({ page }) => {
    const parent = await seedMessage(page, 'Save thread parent');
    const replyText = `Saved thread reply [${Date.now()}]`;
    const replyId = await sendStrategyMessage({
      as: PRIMARY_UID,
      text: replyText,
      parentMessageId: parent.id,
    });
    await saveMessageRest(replyId, PRIMARY_UID);

    await openSavedScreen(page);
    await savedScreenRow(page, replyText).click();

    await expect(page.locator('.cometchat-thread-panel').first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('.cometchat-thread-panel').filter({ hasText: replyText }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('a save that fails offline shows the error toast and no indicator', async ({ page }) => {
    const { text } = await seedMessage(page, 'Offline save');
    const bubble = bubbleWithText(page, text);

    await withOffline(page, async () => {
      await clickMessageOption(page, bubble, SAVE_MESSAGE_OPTION);
      await expect(page.locator('.cometchat-toast__text')).toHaveText(GENERIC_ERROR_TOAST, {
        timeout: 10_000,
      });
    });

    await expect(savedIndicator(bubble)).toHaveCount(0, { timeout: 5_000 });
  });
});
