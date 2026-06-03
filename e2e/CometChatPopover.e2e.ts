import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatpopover';

test.describe('CometChatPopover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
  });

  test('renders trigger correctly', async ({ page }) => {
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens popover on trigger click', async ({ page }) => {
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.click();
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes popover on outside click', async ({ page }) => {
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.click();
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();

    // Click outside
    await page.mouse.click(10, 10);
    await expect(content).not.toBeVisible();
  });

  test('closes popover on Escape key', async ({ page }) => {
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.click();
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(content).not.toBeVisible();
  });

  test('toggles on Enter key', async ({ page }) => {
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(content).not.toBeVisible();
  });

  test('toggles on Space key', async ({ page }) => {
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.focus();
    await page.keyboard.press('Space');
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();
  });

  test('does not close on outside click when closeOnOutsideClick is false', async ({ page }) => {
    await page.goto(`${STORY_BASE}--no-outside-click-close&viewMode=story`);
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.click();
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(content).toBeVisible();
  });

  test('hover trigger opens and closes with debounce', async ({ page }) => {
    await page.goto(`${STORY_BASE}--hover-trigger&viewMode=story`);
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.hover();

    // Wait for debounce
    const content = page.locator('[role="tooltip"]');
    await expect(content).toBeVisible({ timeout: 5000 });

    // Move mouse away
    await page.mouse.move(0, 0);
    await expect(content).not.toBeVisible({ timeout: 5000 });
  });

  test('arrow renders in correct position', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-arrow&viewMode=story`);
    // Click the first trigger (top placement)
    const triggers = page.locator('[class*="cometchat-popover__trigger"]');
    await triggers.first().click();

    const arrow = page.locator('[class*="cometchat-popover__arrow"]');
    await expect(arrow).toBeVisible();
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.click();
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    const trigger = page.locator('[class*="cometchat-popover__trigger"]');
    await trigger.click();
    const content = page.locator('[role="dialog"]');
    await expect(content).toBeVisible();
  });

  test.describe('Focus trap', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-focus-trap&viewMode=story`);
    });

    test('focus moves into popover on open', async ({ page }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.click();
      const content = page.locator('[role="dialog"]');
      await expect(content).toBeVisible();

      // First focusable element inside should be focused
      const firstButton = content.locator('button').first();
      await expect(firstButton).toBeFocused({ timeout: 2000 });
    });

    test('Tab cycles within popover content', async ({ page }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.click();
      const content = page.locator('[role="dialog"]');
      await expect(content).toBeVisible();

      // Wait for focus to settle
      await page.waitForTimeout(100);

      // Tab through all buttons — should stay inside
      await page.keyboard.press('Tab');
      let isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);

      await page.keyboard.press('Tab');
      isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);

      // Tab again should wrap
      await page.keyboard.press('Tab');
      isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);
    });

    test('Shift+Tab cycles backward within popover', async ({ page }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.click();
      const content = page.locator('[role="dialog"]');
      await expect(content).toBeVisible();

      await page.waitForTimeout(100);

      await page.keyboard.press('Shift+Tab');
      const isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);
    });

    test('focus returns to trigger on close', async ({ page, browserName }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.click();
      const content = page.locator('[role="dialog"]');
      await expect(content).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(content).not.toBeVisible();

      if (browserName !== 'webkit') {
        await expect(trigger).toBeFocused();
      }
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses the trigger element', async ({ page }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.focus();
      await expect(trigger).toBeFocused();
    });

    test('Escape closes popover and returns focus', async ({ page, browserName }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.click();
      const content = page.locator('[role="dialog"]');
      await expect(content).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(content).not.toBeVisible();

      if (browserName !== 'webkit') {
        await expect(trigger).toBeFocused();
      }
    });

    test('Enter/Space activates trigger', async ({ page }) => {
      const trigger = page.locator('[class*="cometchat-popover__trigger"]');
      await trigger.focus();
      await page.keyboard.press('Enter');
      const content = page.locator('[role="dialog"]');
      await expect(content).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(content).not.toBeVisible();

      await trigger.focus();
      await page.keyboard.press('Space');
      await expect(content).toBeVisible();
    });
  });
});
