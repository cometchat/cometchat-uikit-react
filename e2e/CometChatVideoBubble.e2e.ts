import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-video';

async function gotoStory(page: import('@playwright/test').Page, storyId: string) {
  await page.goto(`${STORY_BASE}--${storyId}&viewMode=story`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

test.describe('CometChatVideoBubble', () => {
  // ---------------------------------------------------------------------------
  // Single Video (inline <video>)
  // ---------------------------------------------------------------------------

  test.describe('Single Video', () => {
    test('renders outgoing single video with native controls', async ({ page }) => {
      await gotoStory(page, 'default');
      const video = page.locator('video[class*="video-bubble__video"]').first();
      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute('controls', '');
    });

    test('renders incoming single video', async ({ page }) => {
      await gotoStory(page, 'incoming');
      const video = page.locator('video[class*="video-bubble__video"]').first();
      await expect(video).toBeVisible();
    });

    test('video has preload="metadata"', async ({ page }) => {
      await gotoStory(page, 'default');
      const video = page.locator('video[class*="video-bubble__video"]').first();
      await expect(video).toHaveAttribute('preload', 'metadata');
    });

    test('video has aria-label', async ({ page }) => {
      await gotoStory(page, 'default');
      const video = page.locator('video[class*="video-bubble__video"]').first();
      const label = await video.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Caption
  // ---------------------------------------------------------------------------

  test.describe('Caption', () => {
    test('renders caption text below video', async ({ page }) => {
      await gotoStory(page, 'with-caption');
      const caption = page.locator('[class*="video-bubble__caption"]').first();
      await expect(caption).toBeVisible();
      await expect(caption).toContainText('conference');
    });
  });

  // ---------------------------------------------------------------------------
  // Conversation
  // ---------------------------------------------------------------------------

  test.describe('Conversation', () => {
    test('renders both outgoing and incoming video bubbles', async ({ page }) => {
      await gotoStory(page, 'conversation');
      const bubbles = page.locator('[role="article"]');
      await expect(bubbles).toHaveCount(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-Video Grid Layouts
  // ---------------------------------------------------------------------------

  test.describe('Grid Layouts', () => {
    test('2 videos render with thumbnails and play overlays', async ({ page }) => {
      await gotoStory(page, 'grid-2-videos');
      const wrappers = page.locator('[class*="video-bubble__video-wrapper"]');
      await expect(wrappers).toHaveCount(2);

      const playOverlays = page.locator('[class*="play-overlay"]');
      await expect(playOverlays).toHaveCount(2);
    });

    test('3 videos render as 1 top + 2 bottom', async ({ page }) => {
      await gotoStory(page, 'grid-3-videos');
      const wrappers = page.locator('[class*="video-bubble__video-wrapper"]');
      await expect(wrappers).toHaveCount(3);

      const grid = page.locator('[class*="grid--three"]').first();
      await expect(grid).toBeVisible();
    });

    test('4 videos render as 2×2 grid', async ({ page }) => {
      await gotoStory(page, 'grid-4-videos');
      const wrappers = page.locator('[class*="video-bubble__video-wrapper"]');
      await expect(wrappers).toHaveCount(4);

      const grid = page.locator('[class*="grid--2x2"]').first();
      await expect(grid).toBeVisible();
    });

    test('6 videos render with overflow indicator (+2)', async ({ page }) => {
      await gotoStory(page, 'grid-overflow');
      const wrappers = page.locator('[class*="video-bubble__video-wrapper"]');
      await expect(wrappers).toHaveCount(3);

      const overflowTile = page.locator('[class*="overflow-tile"]').first();
      await expect(overflowTile).toBeVisible();

      const overflowText = page.locator('[class*="overflow-text"]').first();
      await expect(overflowText).toContainText('+2');
    });

    test('grid with caption renders both grid and caption', async ({ page }) => {
      await gotoStory(page, 'grid-with-caption');
      const wrappers = page.locator('[class*="video-bubble__video-wrapper"]');
      await expect(wrappers).toHaveCount(3);

      const caption = page.locator('[class*="video-bubble__caption"]').first();
      await expect(caption).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------

  test.describe('Keyboard Accessibility', () => {
    test('grid tile is focusable and has role="button"', async ({ page }) => {
      await gotoStory(page, 'grid-2-videos');
      const wrapper = page.locator('[class*="video-bubble__video-wrapper"]').first();
      await expect(wrapper).toHaveAttribute('tabindex', '0');
      await expect(wrapper).toHaveAttribute('role', 'button');
    });

    test('grid tile has aria-label', async ({ page }) => {
      await gotoStory(page, 'grid-2-videos');
      const wrapper = page.locator('[class*="video-bubble__video-wrapper"]').first();
      const label = await wrapper.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label).toContain('Play video');
    });

    test('play overlay is aria-hidden', async ({ page }) => {
      await gotoStory(page, 'grid-2-videos');
      const overlay = page.locator('[class*="play-overlay"]').first();
      await expect(overlay).toHaveAttribute('aria-hidden', 'true');
    });

    test('overflow tile is focusable and has aria-label', async ({ page }) => {
      await gotoStory(page, 'grid-overflow');
      const tile = page.locator('[class*="overflow-tile"]').first();
      await expect(tile).toHaveAttribute('tabindex', '0');
      await expect(tile).toHaveAttribute('role', 'button');
      const label = await tile.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label).toContain('more');
    });
  });

  // ---------------------------------------------------------------------------
  // Theme & Layout
  // ---------------------------------------------------------------------------

  test.describe('Theme & Layout', () => {
    test('renders in dark theme', async ({ page }) => {
      await gotoStory(page, 'dark-theme');
      // Dark theme has single videos — look for <video> element
      const video = page.locator('video').first();
      await expect(video).toBeVisible({ timeout: 15000 });
    });

    test('renders in RTL layout', async ({ page }) => {
      await gotoStory(page, 'rtl');
      const video = page.locator('video[class*="video-bubble__video"]').first();
      await expect(video).toBeVisible();
    });
  });
});
