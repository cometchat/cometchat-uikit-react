import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatflagmessagedialog';

test.describe('CometChatFlagMessageDialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
  });

  test('renders correctly when open', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('does not render when closed', async ({ page }) => {
    await page.goto(`${STORY_BASE}--controlled-mode&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible();
  });

  test('closes on backdrop click (outside click)', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page
      .locator('[class*="cometchat-flag-message-dialog__backdrop"]')
      .click({ position: { x: 10, y: 10 } });
    await expect(dialog).not.toBeVisible();
  });

  test('does not close on outside click when closeOnOutsideClick is false', async ({ page }) => {
    await page.goto(`${STORY_BASE}--no-outside-click-close&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page
      .locator('[class*="cometchat-flag-message-dialog__backdrop"]')
      .click({ position: { x: 10, y: 10 } });
    await expect(dialog).toBeVisible();
  });

  test('closes on Escape key press', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('selects a reason and submits', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Select the first reason
    const firstReason = dialog.locator('[role="radio"]').first();
    await firstReason.click();
    await expect(firstReason).toHaveAttribute('aria-checked', 'true');

    // Submit
    const submitBtn = dialog.locator('[class*="actions-submit"] button');
    await submitBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('cancel button closes dialog', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const cancelBtn = dialog.locator('[class*="actions-cancel"] button');
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('Tab/Shift+Tab cycles focus within the dialog (focus trap)', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

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

      // Tab again should wrap (focus trap)
      await page.keyboard.press('Tab');
      isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);

      // Shift+Tab should also stay inside
      await page.keyboard.press('Shift+Tab');
      isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);
    });

    test('Escape closes the dialog', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });

    test('Arrow keys navigate reasons', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      const reasons = dialog.locator('[role="radio"]');
      const count = await reasons.count();
      if (count < 2) return;

      // Focus the first reason
      await reasons.first().focus();
      await page.keyboard.press('ArrowDown');

      // Second reason should now be focused and selected
      const secondReason = reasons.nth(1);
      await expect(secondReason).toHaveAttribute('aria-checked', 'true');
    });

    test('Enter/Space selects a reason', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      const firstReason = dialog.locator('[role="radio"]').first();
      await firstReason.focus();
      await page.keyboard.press('Enter');
      await expect(firstReason).toHaveAttribute('aria-checked', 'true');
    });

    test('focus moves into the dialog on open', async ({ page }) => {
      await page.goto(`${STORY_BASE}--controlled-mode&viewMode=story`);
      const openBtn = page.getByRole('button', { name: 'Open Dialog' });
      await openBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Focus should be on the first focusable element inside the dialog
      const isInside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);
    });

    test('focus returns to trigger element on close', async ({ page, browserName }) => {
      await page.goto(`${STORY_BASE}--controlled-mode&viewMode=story`);
      const openBtn = page.getByRole('button', { name: 'Open Dialog' });
      await openBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Wait for focus to settle inside the dialog
      await page.waitForTimeout(200);

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();

      // WebKit does not always honor programmatic .focus() on buttons
      if (browserName !== 'webkit') {
        await expect(openBtn).toBeFocused();
      }
    });
  });
});
