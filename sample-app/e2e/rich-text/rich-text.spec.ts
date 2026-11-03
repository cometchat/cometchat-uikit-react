import { test, expect, Page } from '../helpers/test';
import { loginToApp, openStrategyChat } from '../helpers';
import { expectSendAccepted } from '../helpers/send';

/**
 * E2E Tests — Rich Text Formatting in Message Composer (React)
 *
 * Tests bold, italic, underline, strikethrough, code, lists, etc.
 */

test.describe('Rich Text Formatting', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  // ==================== Toolbar Visibility ====================

  // ==================== Bold Formatting ====================

  test('bold button applies bold formatting', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Bold text');

    await page.keyboard.press('ControlOrMeta+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('ControlOrMeta+b');
    await page.waitForTimeout(300);

    // Ctrl/Cmd+B should apply bold formatting
    const boldContent = await input.locator('strong, b').isVisible().catch(() => false);
    expect(boldContent, 'Bold formatting should be applied via Ctrl/Cmd+B').toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Italic Formatting ====================

  test('italic formatting via keyboard shortcut', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Italic text');

    await page.keyboard.press('ControlOrMeta+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('ControlOrMeta+i');
    await page.waitForTimeout(300);

    const hasItalic = await input.locator('em, i').isVisible().catch(() => false);
    expect(hasItalic).toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Underline Formatting ====================

  test('underline formatting via keyboard shortcut', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Underline text');

    await page.keyboard.press('ControlOrMeta+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('ControlOrMeta+u');
    await page.waitForTimeout(300);

    const hasUnderline = await input.locator('u, [style*="underline"]').isVisible().catch(() => false);
    expect(hasUnderline).toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Strikethrough ====================

  test('strikethrough formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Strikethrough text');

    await page.keyboard.press('ControlOrMeta+a');
    await page.waitForTimeout(300);

    const strikeBtn = page.locator('button[aria-label*="Strikethrough" i], button[aria-label*="strike" i]').first();
    await expect(strikeBtn).toBeVisible({ timeout: 2_000 });
      await strikeBtn.click();
      await page.waitForTimeout(300);

      const hasStrikeContent = await input.locator('strike, s, del').isVisible().catch(() => false);
      expect(hasStrikeContent).toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Code Inline ====================

  test('inline code formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('code snippet');

    await page.keyboard.press('ControlOrMeta+a');
    await page.waitForTimeout(300);

    const codeBtn = page.locator('button[aria-label*="Code" i]:not([aria-label*="block" i])').first();
    await expect(codeBtn).toBeVisible({ timeout: 2_000 });
      await codeBtn.click();
      await page.waitForTimeout(300);

      const hasCodeContent = await input.locator('code').isVisible().catch(() => false);
      expect(hasCodeContent).toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Ordered List ====================

  test('ordered list formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('List item');

    const olBtn = page.locator('button[aria-label*="Ordered" i], button[aria-label*="numbered" i]').first();
    await expect(olBtn).toBeVisible({ timeout: 2_000 });
      await olBtn.click();
      await page.waitForTimeout(300);

      const hasOlContent = await input.locator('ol').isVisible().catch(() => false);
      expect(hasOlContent).toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Unordered List ====================

  test('unordered list formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Bullet item');

    const ulBtn = page.locator('button[aria-label*="Bullet" i], button[aria-label*="unordered" i]').first();
    await expect(ulBtn).toBeVisible({ timeout: 2_000 });
      await ulBtn.click();
      await page.waitForTimeout(300);

      const hasUlContent = await input.locator('ul').isVisible().catch(() => false);
      expect(hasUlContent).toBeTruthy();

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Send Formatted Message ====================

  test('bold text sends and renders bold in the bubble', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    const testMsg = `Formatted ${Date.now()}`;
    await page.keyboard.type(testMsg);
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+b');
    await page.waitForTimeout(300);

    await input.press('End');
    await page.waitForTimeout(100);
    await expectSendAccepted(page, () => input.press('Enter'));

    // The sent bubble renders the text bold, not just as plain text.
    const bubble = page.locator('.cometchat-message-list .cometchat-message-bubble__wrapper').filter({ hasText: testMsg }).last();
    await expect(bubble).toBeVisible({ timeout: 15_000 });
    await expect(bubble.locator('strong, b').filter({ hasText: testMsg })).toBeVisible();
  });
});
