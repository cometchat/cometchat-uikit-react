import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatfullscreenviewer';

test.describe('CometChatFullScreenViewer', () => {
  test('renders image viewer correctly', async ({ page }) => {
    await page.goto(`${STORY_BASE}--single-image&viewMode=story`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-label', 'Image viewer');
  });

  test('close button closes the viewer', async ({ page }) => {
    await page.goto(`${STORY_BASE}--single-image&viewMode=story`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Escape key closes the viewer', async ({ page }) => {
    await page.goto(`${STORY_BASE}--single-image&viewMode=story`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('displays sender info in header', async ({ page }) => {
    await page.goto(`${STORY_BASE}--single-image&viewMode=story`);
    await expect(page.locator('[class*="sender-name"]')).toHaveText('John Doe');
    await expect(page.locator('[class*="sender-status"]')).toHaveText('Online');
  });

  test('renders video viewer', async ({ page }) => {
    await page.goto(`${STORY_BASE}--single-video&viewMode=story`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-label', 'Video viewer');
    const video = page.locator('video');
    await expect(video).toBeVisible();
  });

  test('renders file preview', async ({ page }) => {
    await page.goto(`${STORY_BASE}--single-file&viewMode=story`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-label', 'File viewer');
    await expect(page.locator('[class*="file-preview-name"]')).toHaveText('quarterly-report.pdf');
    await expect(page.locator('[class*="file-extension"]')).toHaveText('PDF');
  });

  test.describe('Gallery mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--gallery-mode&viewMode=story`);
    });

    test('renders navigation buttons', async ({ page }) => {
      await expect(page.getByLabel('Previous')).toBeVisible();
      await expect(page.getByLabel('Next')).toBeVisible();
    });

    test('displays gallery index', async ({ page }) => {
      await expect(page.locator('[class*="index-display"]')).toHaveText('1 of 5');
    });

    test('next button navigates forward', async ({ page }) => {
      await page.getByLabel('Next').click();
      await expect(page.locator('[class*="index-display"]')).toHaveText('2 of 5');
    });

    test('prev button is disabled at first item', async ({ page }) => {
      await expect(page.getByLabel('Previous')).toBeDisabled();
    });

    test('ArrowRight navigates forward', async ({ page, browserName }) => {
      test.fixme(browserName === 'webkit', 'Arrow key navigation unreliable in WebKit Playwright');
      await page.getByRole('dialog').focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[class*="index-display"]')).toHaveText('2 of 5');
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Tab cycles focus within the viewer', async ({ page }) => {
      await page.goto(`${STORY_BASE}--single-image&viewMode=story`);
      const dialog = page.getByRole('dialog');
      await dialog.focus();
      await page.keyboard.press('Tab');
      const isFocusedOnButton = await page.evaluate(() => {
        return document.activeElement?.tagName === 'BUTTON';
      });
      expect(isFocusedOnButton).toBe(true);
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });
});
