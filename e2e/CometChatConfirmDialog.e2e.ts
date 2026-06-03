import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatconfirmdialog';

test.describe('CometChatConfirmDialog', () => {
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
    await page.locator('[class*="cometchat-confirm-dialog__backdrop"]').click({ position: { x: 10, y: 10 } });
    await expect(dialog).not.toBeVisible();
  });

  test('does not close on outside click when closeOnOutsideClick is false', async ({ page }) => {
    await page.goto(`${STORY_BASE}--no-outside-click-close&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.locator('[class*="cometchat-confirm-dialog__backdrop"]').click({ position: { x: 10, y: 10 } });
    await expect(dialog).toBeVisible();
  });

  test('closes on Escape key press', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('confirm button triggers confirm action', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const confirmBtn = dialog.locator('[class*="actions-confirm"] button');
    await confirmBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('cancel button triggers cancel action and closes dialog', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const cancelBtn = dialog.locator('[class*="actions-cancel"] button');
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('shows loading state during async confirm', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-async-confirm&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const confirmBtn = dialog.locator('[class*="actions-confirm"] button');
    await confirmBtn.click();
    await expect(confirmBtn).toHaveAttribute('aria-busy', 'true');
  });

  test('shows error state when confirm fails', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-error-state&viewMode=story`);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const confirmBtn = dialog.locator('[class*="actions-confirm"] button');
    await confirmBtn.click();
    const errorBanner = page.locator('[role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
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

      // Tab through focusable elements — focus should stay inside the dialog
      await page.keyboard.press('Tab');
      let isInside = await page.evaluate(() =>
        document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);

      await page.keyboard.press('Tab');
      isInside = await page.evaluate(() =>
        document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);

      // Tab again should wrap (focus trap) — still inside dialog
      await page.keyboard.press('Tab');
      isInside = await page.evaluate(() =>
        document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);

      // Shift+Tab should also stay inside
      await page.keyboard.press('Shift+Tab');
      isInside = await page.evaluate(() =>
        document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(isInside).toBe(true);
    });

    test('Escape closes the dialog', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });

    test('Enter activates the focused button', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      // Click the cancel button to focus it, then use keyboard
      const cancelBtn = dialog.locator('[class*="actions-cancel"] button');
      await cancelBtn.focus();
      await page.keyboard.press('Enter');
      await expect(dialog).not.toBeVisible();
    });

    test('Space activates the focused button', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      const cancelBtn = dialog.locator('[class*="actions-cancel"] button');
      await cancelBtn.focus();
      await page.keyboard.press('Space');
      await expect(dialog).not.toBeVisible();
    });

    test('focus moves into the dialog on open', async ({ page }) => {
      await page.goto(`${STORY_BASE}--controlled-mode&viewMode=story`);
      const openBtn = page.getByRole('button', { name: 'Open Dialog' });
      await openBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Wait for focus to settle on the first focusable child inside the dialog
      const cancelBtn = dialog.locator('[class*="actions-cancel"] button');
      await expect(cancelBtn).toBeFocused({ timeout: 2000 });
    });

    test('focus returns to trigger element on close', async ({ page, browserName }) => {
      await page.goto(`${STORY_BASE}--controlled-mode&viewMode=story`);
      const openBtn = page.getByRole('button', { name: 'Open Dialog' });
      await openBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Wait for focus to settle inside the dialog before pressing Escape
      const cancelBtn = dialog.locator('[class*="actions-cancel"] button');
      await expect(cancelBtn).toBeFocused({ timeout: 2000 });

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();

      // WebKit does not always honor programmatic .focus() on buttons,
      // so only assert focus restoration in Chromium and Firefox.
      if (browserName !== 'webkit') {
        await expect(openBtn).toBeFocused();
      }
    });
  });
});
