import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

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

  test('formatting toolbar appears when text is selected or on focus', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Test formatting text');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(500);

    const toolbar = page.locator('.cometchat-message-composer__toolbar, [class*="formatting-toolbar"]').first();
    const hasToolbar = await toolbar.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasToolbar, 'Element should be visible: hasToolbar').toBeTruthy();
      await expect(toolbar).toBeVisible();
    await page.keyboard.press('Backspace');
  });

  // ==================== Bold Formatting ====================

  test('bold button applies bold formatting', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Bold text');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);

    // Meta+B should apply bold formatting
    const boldContent = await input.locator('strong, b').isVisible().catch(() => false);
    expect(boldContent, 'Bold formatting should be applied via Meta+B').toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Italic Formatting ====================

  test('italic formatting via keyboard shortcut', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Italic text');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+i');
    await page.waitForTimeout(300);

    const hasItalic = await input.locator('em, i').isVisible().catch(() => false);
    expect(hasItalic).toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Underline Formatting ====================

  test('underline formatting via keyboard shortcut', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Underline text');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+u');
    await page.waitForTimeout(300);

    const hasUnderline = await input.locator('u, [style*="underline"]').isVisible().catch(() => false);
    expect(hasUnderline).toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Strikethrough ====================

  test('strikethrough formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Strikethrough text');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);

    const strikeBtn = page.locator('button[aria-label*="Strikethrough" i], button[aria-label*="strike" i]').first();
    const hasStrike = await strikeBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasStrike, 'Element should be visible: hasStrike').toBeTruthy();
      await strikeBtn.click();
      await page.waitForTimeout(300);

      const hasStrikeContent = await input.locator('strike, s, del').isVisible().catch(() => false);
      expect(hasStrikeContent).toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Code Inline ====================

  test('inline code formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('code snippet');

    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);

    const codeBtn = page.locator('button[aria-label*="Code" i]:not([aria-label*="block" i])').first();
    const hasCode = await codeBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasCode, 'Element should be visible: hasCode').toBeTruthy();
      await codeBtn.click();
      await page.waitForTimeout(300);

      const hasCodeContent = await input.locator('code').isVisible().catch(() => false);
      expect(hasCodeContent).toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Ordered List ====================

  test('ordered list formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('List item');

    const olBtn = page.locator('button[aria-label*="Ordered" i], button[aria-label*="numbered" i]').first();
    const hasOl = await olBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasOl, 'Element should be visible: hasOl').toBeTruthy();
      await olBtn.click();
      await page.waitForTimeout(300);

      const hasOlContent = await input.locator('ol').isVisible().catch(() => false);
      expect(hasOlContent).toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Unordered List ====================

  test('unordered list formatting via toolbar', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Bullet item');

    const ulBtn = page.locator('button[aria-label*="Bullet" i], button[aria-label*="unordered" i]').first();
    const hasUl = await ulBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasUl, 'Element should be visible: hasUl').toBeTruthy();
      await ulBtn.click();
      await page.waitForTimeout(300);

      const hasUlContent = await input.locator('ul').isVisible().catch(() => false);
      expect(hasUlContent).toBeTruthy();

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  });

  // ==================== Send Formatted Message ====================

  test('formatted message sends and renders correctly', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    const testMsg = `Formatted ${Date.now()}`;
    await page.keyboard.type(testMsg);
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);

    await input.press('End');
    await page.waitForTimeout(100);
    await input.press('Enter');

    await expect(
      page.locator('.cometchat-message-list').getByText(testMsg)
    ).toBeVisible({ timeout: 15_000 });
  });
});
