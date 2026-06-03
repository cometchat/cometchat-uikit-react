import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-image';

/**
 * Navigate to a story and wait for the page to be ready.
 * External images (picsum.photos) can be slow, so we wait for DOM content
 * rather than network idle.
 */
async function gotoStory(page: import('@playwright/test').Page, storyId: string) {
  await page.goto(`${STORY_BASE}--${storyId}&viewMode=story`);
  await page.waitForLoadState('domcontentloaded');
  // Give Storybook a moment to render the story
  await page.waitForTimeout(500);
}

test.describe('CometChatImageBubble', () => {
  // ---------------------------------------------------------------------------
  // Single Image Rendering
  // ---------------------------------------------------------------------------

  test.describe('Single Image', () => {
    test('renders outgoing single image', async ({ page }) => {
      await gotoStory(page, 'default');
      const img = page.locator('img[class*="image-bubble__image"]').first();
      await expect(img).toBeVisible();
    });

    test('renders incoming single image with avatar', async ({ page }) => {
      await gotoStory(page, 'incoming');
      const img = page.locator('img[class*="image-bubble__image"]').first();
      await expect(img).toBeVisible();
    });

    test('image has lazy loading attribute', async ({ page }) => {
      await gotoStory(page, 'default');
      const img = page.locator('img[class*="image-bubble__image"]').first();
      await expect(img).toHaveAttribute('loading', 'lazy');
    });

    test('image has async decoding attribute', async ({ page }) => {
      await gotoStory(page, 'default');
      const img = page.locator('img[class*="image-bubble__image"]').first();
      await expect(img).toHaveAttribute('decoding', 'async');
    });

    test('image has alt text', async ({ page }) => {
      await gotoStory(page, 'default');
      const img = page.locator('img[class*="image-bubble__image"]').first();
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Caption
  // ---------------------------------------------------------------------------

  test.describe('Caption', () => {
    test('renders caption text below image', async ({ page }) => {
      await gotoStory(page, 'with-caption');
      const caption = page.locator('[class*="image-bubble__caption"]').first();
      await expect(caption).toBeVisible();
    });

    test('caption contains the expected text', async ({ page }) => {
      await gotoStory(page, 'with-caption');
      const caption = page.locator('[class*="image-bubble__caption"]').first();
      await expect(caption).toContainText('sunset');
    });

    test('long caption wraps within bubble width', async ({ page }) => {
      await gotoStory(page, 'long-caption');
      const bubble = page.locator('[class*="image-bubble"]').first();
      const caption = page.locator('[class*="image-bubble__caption"]').first();
      await expect(bubble).toBeVisible();
      await expect(caption).toBeVisible();

      const bubbleBox = await bubble.boundingBox();
      const captionBox = await caption.boundingBox();
      expect(bubbleBox).toBeTruthy();
      expect(captionBox).toBeTruthy();
      // Caption should not exceed bubble width
      if (captionBox && bubbleBox) {
        expect(captionBox.width).toBeLessThanOrEqual(bubbleBox.width + 1);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Conversation (outgoing + incoming)
  // ---------------------------------------------------------------------------

  test.describe('Conversation', () => {
    test('renders both outgoing and incoming image bubbles', async ({ page }) => {
      await gotoStory(page, 'conversation');
      // Each message bubble contains one img — count the bubble wrappers
      const bubbles = page.locator('[role="article"]');
      await expect(bubbles).toHaveCount(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Image Sizing
  // ---------------------------------------------------------------------------

  test.describe('Image Sizing', () => {
    test('tiny image does not collapse the bubble', async ({ page }) => {
      await gotoStory(page, 'tiny-image');
      const wrapper = page.locator('[class*="image-bubble__image-wrapper"]').first();
      await expect(wrapper).toBeVisible();
      const box = await wrapper.boundingBox();
      expect(box).toBeTruthy();
      // Should be at least the min-width (130px) with some tolerance
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(120);
        expect(box.height).toBeGreaterThanOrEqual(120);
      }
    });

    test('large image is capped at max size', async ({ page }) => {
      await gotoStory(page, 'large-image');
      const wrapper = page.locator('[class*="image-bubble__image-wrapper"]').first();
      await expect(wrapper).toBeVisible();
      const box = await wrapper.boundingBox();
      expect(box).toBeTruthy();
      // Should not exceed the max-width (400px) + some tolerance
      if (box) {
        expect(box.width).toBeLessThanOrEqual(420);
      }
    });

    test('mixed sizes render without breaking layout', async ({ page }) => {
      await gotoStory(page, 'mixed-sizes');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      // Wait for at least one to appear
      await expect(wrappers.first()).toBeVisible({ timeout: 10000 });
      const count = await wrappers.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-Image Grid Layouts
  // ---------------------------------------------------------------------------

  test.describe('Grid Layouts', () => {
    test('2 images render side by side', async ({ page }) => {
      await gotoStory(page, 'grid-2-images');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      await expect(wrappers).toHaveCount(2);

      const grid = page.locator('[class*="grid--two-col"]').first();
      await expect(grid).toBeVisible();
    });

    test('3 images render as 1 top + 2 bottom', async ({ page }) => {
      await gotoStory(page, 'grid-3-images');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      await expect(wrappers).toHaveCount(3);

      const grid = page.locator('[class*="grid--three"]').first();
      await expect(grid).toBeVisible();

      // First image should be wider than the second (spans full width)
      const firstBox = await wrappers.nth(0).boundingBox();
      const secondBox = await wrappers.nth(1).boundingBox();
      expect(firstBox).toBeTruthy();
      expect(secondBox).toBeTruthy();
      if (firstBox && secondBox) {
        expect(firstBox.width).toBeGreaterThan(secondBox.width);
      }
    });

    test('4 images render as 2×2 grid', async ({ page }) => {
      await gotoStory(page, 'grid-4-images');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      await expect(wrappers).toHaveCount(4);

      const grid = page.locator('[class*="grid--2x2"]').first();
      await expect(grid).toBeVisible();
    });

    test('6 images render with overflow indicator (+2)', async ({ page }) => {
      await gotoStory(page, 'grid-overflow');
      // 3 image wrappers + 1 overflow tile
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      await expect(wrappers).toHaveCount(3);

      const overflowTile = page.locator('[class*="overflow-tile"]').first();
      await expect(overflowTile).toBeVisible();

      const overflowText = page.locator('[class*="overflow-text"]').first();
      await expect(overflowText).toContainText('+2');
    });

    test('10 images render with overflow indicator (+6)', async ({ page }) => {
      await gotoStory(page, 'grid-large-overflow');
      const overflowText = page.locator('[class*="overflow-text"]').first();
      await expect(overflowText).toContainText('+6');
    });

    test('grid with caption renders both grid and caption', async ({ page }) => {
      await gotoStory(page, 'grid-with-caption');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      await expect(wrappers).toHaveCount(3);

      const caption = page.locator('[class*="image-bubble__caption"]').first();
      await expect(caption).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------

  test.describe('Keyboard Accessibility', () => {
    test('image wrapper is focusable via Tab', async ({ page }) => {
      await gotoStory(page, 'default');
      const wrapper = page.locator('[class*="image-bubble__image-wrapper"]').first();
      await expect(wrapper).toHaveAttribute('tabindex', '0');
      await expect(wrapper).toHaveAttribute('role', 'button');
    });

    test('image wrapper has aria-label', async ({ page }) => {
      await gotoStory(page, 'default');
      const wrapper = page.locator('[class*="image-bubble__image-wrapper"]').first();
      const label = await wrapper.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label).toContain('fullscreen');
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

    test('overflow text is aria-hidden', async ({ page }) => {
      await gotoStory(page, 'grid-overflow');
      const text = page.locator('[class*="overflow-text"]').first();
      await expect(text).toHaveAttribute('aria-hidden', 'true');
    });

    test('grid images are individually focusable', async ({ page }) => {
      await gotoStory(page, 'grid-4-images');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      const count = await wrappers.count();
      for (let i = 0; i < count; i++) {
        await expect(wrappers.nth(i)).toHaveAttribute('tabindex', '0');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Theme & Layout Variants
  // ---------------------------------------------------------------------------

  test.describe('Theme & Layout', () => {
    test('renders in dark theme', async ({ page }) => {
      await gotoStory(page, 'dark-theme');
      const wrappers = page.locator('[class*="image-bubble__image-wrapper"]');
      await expect(wrappers.first()).toBeVisible({ timeout: 10000 });
      const count = await wrappers.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('renders in RTL layout', async ({ page }) => {
      await gotoStory(page, 'rtl');
      const img = page.locator('img[class*="image-bubble__image"]').first();
      await expect(img).toBeVisible();
    });
  });
});
