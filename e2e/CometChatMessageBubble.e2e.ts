import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble';

test.describe('CometChatMessageBubble', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
  });

  test('renders bubble with content', async ({ page }) => {
    const bubble = page.locator('[role="article"]').first();
    await expect(bubble).toBeVisible();
  });

  test('shows outgoing and incoming bubbles', async ({ page }) => {
    const outgoing = page.locator('[class*="outgoing"]').first();
    const incoming = page.locator('[class*="incoming"]').first();
    await expect(outgoing).toBeVisible();
    await expect(incoming).toBeVisible();
  });

  test('shows avatar for incoming messages in group', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-sender-info&viewMode=story`);
    const avatar = page.locator('[aria-label*="Avatar for"]').first();
    await expect(avatar).toBeVisible();
  });

  test('shows sender name in group context', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-sender-info&viewMode=story`);
    const senderName = page.locator('[class*="sender-name"]').first();
    await expect(senderName).toBeVisible();
  });

  test('shows timestamp', async ({ page }) => {
    const time = page.locator('time').first();
    await expect(time).toBeVisible();
  });

  test('shows receipts for outgoing messages', async ({ page }) => {
    await page.goto(`${STORY_BASE}--receipt-states&viewMode=story`);
    const receipt = page.locator('[role="img"][aria-label="Sent"]').first();
    await expect(receipt).toBeVisible();
  });

  test('shows read receipt', async ({ page }) => {
    await page.goto(`${STORY_BASE}--receipt-states&viewMode=story`);
    const readReceipt = page.locator('[role="img"][aria-label="Read"]');
    await expect(readReceipt).toBeVisible();
  });

  test('shows error receipt', async ({ page }) => {
    await page.goto(`${STORY_BASE}--receipt-states&viewMode=story`);
    const errorReceipt = page.locator('[role="img"][aria-label="Error"]');
    await expect(errorReceipt).toBeVisible();
  });

  test('shows edited indicator', async ({ page }) => {
    await page.goto(`${STORY_BASE}--edited-message&viewMode=story`);
    const edited = page.locator('text=edited').first();
    await expect(edited).toBeVisible();
  });

  test('shows thread replies', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-thread-replies&viewMode=story`);
    const thread = page.locator('[class*="cometchat-thread-view"]').first();
    await expect(thread).toBeVisible();
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const bubble = page.locator('[role="article"]').first();
    await expect(bubble).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    const bubble = page.locator('[role="article"]').first();
    await expect(bubble).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('bubble wrapper is focusable', async ({ page }) => {
      const bubble = page.locator('[role="article"]').first();
      await bubble.focus();
      await expect(bubble).toBeFocused();
    });

    test('avatar is keyboard accessible', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-sender-info&viewMode=story`);
      const avatar = page.locator('[aria-label*="Avatar for"]').first();
      await expect(avatar).toHaveAttribute('tabindex', '0');
    });
  });
});
