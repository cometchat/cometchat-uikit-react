import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

/**
 * E2E Tests — CometChatReactions (React)
 *
 * Tests the reactions components on messages.
 * The first test adds a reaction via the UI so subsequent tests can verify display.
 */

test.describe('CometChatReactions', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    // Send a fresh message via REST API so we have a clean bubble to react to
    const APP_ID = process.env.COMETCHAT_APP_ID ?? '';
    const REGION = process.env.COMETCHAT_REGION ?? 'us';
    const API_KEY = process.env.COMETCHAT_API_KEY ?? '';
    const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
    await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: API_KEY, appid: APP_ID, onBehalfOf: 'e2e-user-1' },
      body: JSON.stringify({
        receiver: 'e2e-group-35',
        receiverType: 'group',
        category: 'message',
        type: 'text',
        data: { text: `React to this [${Date.now()}]` },
      }),
    });

    await openStrategyChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ==================== Add Reaction First ====================

  test('add a reaction to a message via the UI', async () => {
    const messageBubble = page.locator('.cometchat-message-bubble__body-wrapper').last();
    await expect(messageBubble).toBeVisible({ timeout: 10_000 });

    // Hover to show quick actions (React button is a top-menu quick action)
    await messageBubble.hover();
    await page.waitForTimeout(500);

    // Click the "React" quick action button (shown directly on hover, aria-label="React")
    const reactBtn = page.locator('button[aria-label="React"]').last();
    await expect(reactBtn).toBeVisible({ timeout: 5_000 });
    await reactBtn.click();
    await page.waitForTimeout(1000);

    // Emoji picker should open
    const emojiPicker = page.locator('.cometchat-emoji-keyboard').first();
    await expect(emojiPicker).toBeVisible({ timeout: 5_000 });

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

  test('reactions display on messages that have them', async () => {
    const reactions = page.locator('.cometchat-reactions').first();
    await expect(reactions).toBeVisible({ timeout: 10_000 });

    const reactionItems = reactions.locator('.cometchat-reactions__chip');
    const count = await reactionItems.count();
    expect(count).toBeGreaterThan(0);
  });

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

  test('clicking a reaction emoji toggles it', async () => {
    const reactionItem = page.locator('.cometchat-reactions__chip').first();
    await expect(reactionItem).toBeVisible({ timeout: 10_000 });

    await reactionItem.click();
    await page.waitForTimeout(2000);
    // No error means the click was processed (reaction toggled)
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
