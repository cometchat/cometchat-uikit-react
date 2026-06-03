import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-file';

async function gotoStory(page: import('@playwright/test').Page, storyId: string) {
  await page.goto(`${STORY_BASE}--${storyId}&viewMode=story`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

test.describe('CometChatFileBubble', () => {
  test.describe('Single File', () => {
    test('renders file with name and download button', async ({ page }) => {
      await gotoStory(page, 'default');
      const filename = page.locator('[class*="file-bubble__filename"]').first();
      await expect(filename).toBeVisible();

      const download = page.locator('a[class*="download"]').first();
      await expect(download).toBeVisible();
    });

    test('renders incoming file', async ({ page }) => {
      await gotoStory(page, 'incoming');
      const item = page.locator('[class*="file-bubble__file-item"]').first();
      await expect(item).toBeVisible();
    });

    test('renders file type icon', async ({ page }) => {
      await gotoStory(page, 'default');
      const icon = page.locator('img[class*="file-bubble__icon"]').first();
      await expect(icon).toBeVisible();
    });
  });

  test.describe('Caption', () => {
    test('renders caption below file', async ({ page }) => {
      await gotoStory(page, 'with-caption');
      const caption = page.locator('[class*="file-bubble__caption"]').first();
      await expect(caption).toBeVisible();
      await expect(caption).toContainText('proposal');
    });
  });

  test.describe('File Types', () => {
    test('renders multiple file types', async ({ page }) => {
      await gotoStory(page, 'file-types');
      // Wait for file items to render (icons may load slowly)
      const firstItem = page.locator('[class*="file-bubble__file-item"]').first();
      await expect(firstItem).toBeVisible({ timeout: 10000 });
      const items = page.locator('[class*="file-bubble__file-item"]');
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Multi-File', () => {
    test('shows "Show more +N" toggle for many files', async ({ page }) => {
      await gotoStory(page, 'multiple-files');
      const toggle = page.locator('[class*="toggle-control"]').first();
      await expect(toggle).toBeVisible();
      await expect(toggle).toContainText('Show more');
    });

    test('expands to show all files on click', async ({ page }) => {
      await gotoStory(page, 'multiple-files');
      const toggle = page.locator('[class*="toggle-control"]').first();
      await toggle.click();

      await expect(toggle).toContainText('Show less');

      const items = page.locator('[class*="file-bubble__file-item"]');
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('collapses back on "Show less" click', async ({ page }) => {
      await gotoStory(page, 'multiple-files');
      const toggle = page.locator('[class*="toggle-control"]').first();
      await toggle.click();
      await expect(toggle).toContainText('Show less');

      await toggle.click();
      await expect(toggle).toContainText('Show more');
    });
  });

  test.describe('Accessibility', () => {
    test('file item has aria-label', async ({ page }) => {
      await gotoStory(page, 'default');
      const item = page.locator('[class*="file-bubble__file-item"]').first();
      const label = await item.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });

    test('download link has aria-label', async ({ page }) => {
      await gotoStory(page, 'default');
      const link = page.locator('a[class*="download"]').first();
      const label = await link.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label).toContain('Download');
    });

    test('expand toggle has aria-expanded', async ({ page }) => {
      await gotoStory(page, 'multiple-files');
      const toggle = page.locator('[class*="toggle-control"]').first();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test.describe('Theme & Layout', () => {
    test('renders in dark theme', async ({ page }) => {
      await gotoStory(page, 'dark-theme');
      const item = page.locator('[class*="file-bubble__file-item"]').first();
      await expect(item).toBeVisible();
    });

    test('renders in RTL layout', async ({ page }) => {
      await gotoStory(page, 'rtl');
      const item = page.locator('[class*="file-bubble__file-item"]').first();
      await expect(item).toBeVisible();
    });
  });
});
