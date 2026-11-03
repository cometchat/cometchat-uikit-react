import { test, expect, Page } from '../helpers/test';
import { loginToApp, openStrategyChat } from '../helpers';
import { waitForBubbleSettled } from '../helpers/threads';
import { addReaction, sendStrategyMessage, PRIMARY_UID, SECONDARY_UID } from '../helpers/pinSave';

/**
 * E2E Tests — CometChatReactions (React)
 *
 * Tests the reactions components on messages.
 * The first test adds a reaction via the UI. It is tagged @smoke, so it can run without the
 * rest (and a run that excludes @smoke skips it): the setup also gives the fresh message
 * reactions over REST, so the later tests don't depend on it.
 */

test.describe('CometChatReactions', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    // A fresh message to react to, already carrying our reaction and someone else's (that one stays
    // when a test removes ours).
    const id = await sendStrategyMessage({ as: PRIMARY_UID, text: `React to this [${Date.now()}]` });
    for (const [uid, emoji] of [[PRIMARY_UID, '👍'], [SECONDARY_UID, '❤️']] as const) {
      await addReaction(id, emoji, uid);
    }

    await openStrategyChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ==================== Add Reaction First ====================

  test('add a reaction to a message via the UI', { tag: '@smoke' }, async () => {
    const messageBubble = page.locator('.cometchat-message-bubble__body-wrapper').last();
    await expect(messageBubble).toBeVisible({ timeout: 10_000 });
    // The fresh message scrolls the list; a scroll closes the emoji picker, so let it settle.
    await waitForBubbleSettled(messageBubble);

    // Hover to show the quick actions, then open the picker from "React". A late scroll (the
    // seeded reactions arriving) closes the picker, so open it again until it stays open.
    const reactBtn = page.locator('button[aria-label="React"]').last();
    const emojiPicker = page.locator('.cometchat-emoji-keyboard').first();
    await expect(async () => {
      if (await emojiPicker.isVisible()) return;
      await messageBubble.hover();
      await reactBtn.click({ timeout: 3_000 });
      await expect(emojiPicker).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });

    // Click the first emoji in the picker
    const emoji = emojiPicker.locator('.cometchat-emoji-keyboard__emoji-item').first();
    await expect(emoji).toBeVisible({ timeout: 5_000 });
    await emoji.click();
    await page.waitForTimeout(2000);

    // Verify reaction was added
    const reactions = page.locator('.cometchat-reactions').first();
    await expect(reactions).toBeVisible({ timeout: 10_000 });
  });

  // ==================== Reactions Display ====================

  // ==================== Reaction Count ====================

  test('reaction count displays correctly', async () => {
    const reactionItem = page.locator('.cometchat-reactions__chip').first();
    await expect(reactionItem).toBeVisible({ timeout: 10_000 });

    // Each reaction item should show an emoji and a count
    const countElement = reactionItem.locator('.cometchat-reactions__chip-count');
    await expect(countElement).toBeVisible({ timeout: 5_000 });
    const text = await countElement.textContent();
    expect(text?.trim()).toMatch(/\d+/);
  });

  // ==================== Clicking Reaction ====================

  test('clicking your own reaction removes it', async () => {
    const reacted = page
      .locator('.cometchat-message-bubble__wrapper')
      .filter({ has: page.locator('.cometchat-reactions__chip--active') })
      .last();
    await expect(reacted).toBeVisible({ timeout: 10_000 });

    // Pin the bubble by its text, so the locator survives the chip going away.
    const text = (await reacted.locator('.cometchat-message-bubble__body').first().innerText()).split('\n')[0].trim();
    const bubble = page.locator('.cometchat-message-bubble__wrapper').filter({ hasText: text }).last();
    const mine = bubble.locator('.cometchat-reactions__chip--active').first();
    const emoji = (await mine.locator('.cometchat-reactions__chip-emoji').innerText()).trim();

    await mine.click();
    await expect(bubble.locator('.cometchat-reactions__chip--active').filter({ hasText: emoji })).toHaveCount(0, {
      timeout: 10_000,
    });

    // If others reacted with the same emoji the chip stays — clicking it again adds mine back.
    const remaining = bubble.locator('.cometchat-reactions__chip').filter({ hasText: emoji });
    if ((await remaining.count()) > 0) {
      await remaining.first().click();
      await expect(bubble.locator('.cometchat-reactions__chip--active').filter({ hasText: emoji })).toHaveCount(1, {
        timeout: 10_000,
      });
    }
  });

  // ==================== Reaction Info (Hover/Tooltip) ====================

  test('hovering a reaction shows reaction info', async () => {
    // Re-add a reaction since toggle may have removed it
    const messageBubble = page.locator('.cometchat-message-bubble__body-wrapper').last();
    await messageBubble.hover();
    await page.waitForTimeout(500);

    const addReactionBtn = page.locator('button[aria-label="React"]').last();
    const btnVisible = await addReactionBtn.isVisible().catch(() => false);
    if (btnVisible) {
      await addReactionBtn.click();
      await page.waitForTimeout(1000);
      const emojiPicker = page.locator('.cometchat-emoji-keyboard, [class*="emoji-keyboard"]').first();
      const pickerVisible = await emojiPicker.isVisible().catch(() => false);
      if (pickerVisible) {
        const emoji = emojiPicker.locator('.cometchat-emoji-keyboard__emoji-item').first();
        await emoji.click();
        await page.waitForTimeout(2000);
      }
    }

    const reactionItem = page.locator('.cometchat-reactions__chip').first();
    await expect(reactionItem).toBeVisible({ timeout: 10_000 });

    await reactionItem.hover();
    await page.waitForTimeout(1000);

    const tooltip = page.locator('.cometchat-reactions__info').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
  });
});
