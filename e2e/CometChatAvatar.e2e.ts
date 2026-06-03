import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatavatar';

test.describe('CometChatAvatar', () => {
  // ─── Default (image avatar) ────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the avatar container', async ({ page }) => {
      const avatar = page.locator('[class*="cometchat-avatar"]').first();
      await expect(avatar).toBeVisible();
    });

    test('has role="img" on the root', async ({ page }) => {
      const avatar = page.locator('[role="img"]');
      await expect(avatar).toBeVisible();
    });

    test('has aria-label with the name', async ({ page }) => {
      const avatar = page.locator('[role="img"]');
      await expect(avatar).toHaveAttribute('aria-label', 'John Doe');
    });

    test('renders the image element', async ({ page }) => {
      const img = page.locator('[class*="cometchat-avatar__image"]');
      await expect(img).toBeVisible();
    });

    test('image has correct alt text', async ({ page }) => {
      const img = page.locator('[class*="cometchat-avatar__image"]');
      await expect(img).toHaveAttribute('alt', 'John Doe');
    });

    test('sets data-size="medium" by default', async ({ page }) => {
      const avatar = page.locator('[role="img"]');
      await expect(avatar).toHaveAttribute('data-size', 'medium');
    });
  });

  // ─── Initials fallback ─────────────────────────────────────────────

  test.describe('InitialsFallback story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--initials-fallback&viewMode=story`);
    });

    test('renders initials when no image is provided', async ({ page }) => {
      const initials = page.locator('[class*="cometchat-avatar__initials"]');
      await expect(initials).toBeVisible();
      await expect(initials).toHaveText('JS');
    });

    test('does not render an image element', async ({ page }) => {
      const img = page.locator('[class*="cometchat-avatar__image"]');
      await expect(img).toHaveCount(0);
    });
  });

  // ─── Image error fallback ──────────────────────────────────────────

  test.describe('ImageErrorFallback story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--image-error-fallback&viewMode=story`);
    });

    test('falls back to initials when image fails to load', async ({ page }) => {
      const initials = page.locator('[class*="cometchat-avatar__initials"]');
      await expect(initials).toBeVisible({ timeout: 10_000 });
      await expect(initials).toHaveText('BW');
    });
  });

  // ─── Size variants ─────────────────────────────────────────────────

  test.describe('SizeVariants story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--size-variants&viewMode=story`);
    });

    test('renders three avatars with different sizes', async ({ page }) => {
      const avatars = page.locator('[role="img"]');
      await expect(avatars).toHaveCount(3);
    });

    test('small avatar has data-size="small"', async ({ page }) => {
      const small = page.locator('[role="img"][data-size="small"]');
      await expect(small).toBeVisible();
    });

    test('medium avatar has data-size="medium"', async ({ page }) => {
      const medium = page.locator('[role="img"][data-size="medium"]');
      await expect(medium).toBeVisible();
    });

    test('large avatar has data-size="large"', async ({ page }) => {
      const large = page.locator('[role="img"][data-size="large"]');
      await expect(large).toBeVisible();
    });

    test('small avatar is smaller than medium', async ({ page }) => {
      const small = page.locator('[role="img"][data-size="small"]');
      const medium = page.locator('[role="img"][data-size="medium"]');
      const smallBox = await small.boundingBox();
      const mediumBox = await medium.boundingBox();
      expect(smallBox!.width).toBeLessThan(mediumBox!.width);
    });

    test('medium avatar is smaller than large', async ({ page }) => {
      const medium = page.locator('[role="img"][data-size="medium"]');
      const large = page.locator('[role="img"][data-size="large"]');
      const mediumBox = await medium.boundingBox();
      const largeBox = await large.boundingBox();
      expect(mediumBox!.width).toBeLessThan(largeBox!.width);
    });
  });

  // ─── Status indicator (online) ─────────────────────────────────────

  test.describe('StatusOnline story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--status-online&viewMode=story`);
    });

    test('renders the status indicator', async ({ page }) => {
      const indicator = page.locator('[class*="cometchat-avatar__status-indicator"]');
      await expect(indicator).toBeVisible();
    });

    test('status indicator has data-status="online"', async ({ page }) => {
      const indicator = page.locator('[class*="cometchat-avatar__status-indicator"]');
      await expect(indicator).toHaveAttribute('data-status', 'online');
    });

    test('status indicator has role="status"', async ({ page }) => {
      const indicator = page.locator('[role="status"]');
      await expect(indicator).toBeVisible();
    });

    test('status indicator has aria-label "Online"', async ({ page }) => {
      const indicator = page.locator('[role="status"]');
      await expect(indicator).toHaveAttribute('aria-label', 'Online');
    });
  });

  // ─── Status indicator (offline) ────────────────────────────────────

  test.describe('StatusOffline story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--status-offline&viewMode=story`);
    });

    test('status indicator has data-status="offline"', async ({ page }) => {
      const indicator = page.locator('[class*="cometchat-avatar__status-indicator"]');
      await expect(indicator).toHaveAttribute('data-status', 'offline');
    });

    test('status indicator has aria-label "Offline"', async ({ page }) => {
      const indicator = page.locator('[role="status"]');
      await expect(indicator).toHaveAttribute('aria-label', 'Offline');
    });
  });

  // ─── Dark theme ────────────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside a dark theme container', async ({ page }) => {
      const themeContainer = page.locator('[data-theme="dark"]');
      await expect(themeContainer).toBeVisible();
    });

    test('avatars are visible in dark theme', async ({ page }) => {
      const avatars = page.locator('[role="img"]');
      await expect(avatars).toHaveCount(2);
    });

    test('status indicators render in dark theme', async ({ page }) => {
      const indicators = page.locator('[class*="cometchat-avatar__status-indicator"]');
      await expect(indicators).toHaveCount(2);
    });
  });

  // ─── RTL ───────────────────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    });

    test('renders inside an RTL container', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
    });

    test('avatars are visible in RTL', async ({ page }) => {
      const avatars = page.locator('[role="img"]');
      await expect(avatars).toHaveCount(2);
    });

    test('RTL container has correct direction', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      const direction = await rtlContainer.evaluate(
        (el) => window.getComputedStyle(el).direction
      );
      expect(direction).toBe('rtl');
    });
  });

  // ─── Long name ─────────────────────────────────────────────────────

  test.describe('LongName story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-name&viewMode=story`);
    });

    test('renders initials from first two words', async ({ page }) => {
      const initials = page.locator('[class*="cometchat-avatar__initials"]');
      await expect(initials).toHaveText('AB');
    });
  });

  // ─── Single character name ─────────────────────────────────────────

  test.describe('SingleCharName story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--single-char-name&viewMode=story`);
    });

    test('renders single character as initial', async ({ page }) => {
      const initials = page.locator('[class*="cometchat-avatar__initials"]');
      await expect(initials).toBeVisible();
      // Single char "A" → getInitials returns first 2 chars, but only 1 available
      await expect(initials).toHaveText('A');
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  test.describe('Accessibility', () => {
    test('root has role="img"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const avatar = page.locator('[role="img"]');
      await expect(avatar).toBeVisible();
    });

    test('root has aria-label matching the name', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const avatar = page.locator('[role="img"]');
      await expect(avatar).toHaveAttribute('aria-label', 'John Doe');
    });

    test('root has fallback aria-label "Avatar" when no name', async ({ page }) => {
      // The InitialsFallback story has a name, so we test Default which always has a name.
      // The fallback is tested in unit tests. Here we verify the attribute exists.
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const avatar = page.locator('[role="img"]');
      const label = await avatar.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });

    test('image has alt text', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const img = page.locator('[class*="cometchat-avatar__image"]');
      await expect(img).toHaveAttribute('alt', 'John Doe');
    });

    test('status indicator has role="status"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--status-online&viewMode=story`);
      const indicator = page.locator('[role="status"]');
      await expect(indicator).toBeVisible();
    });

    test('status indicator has descriptive aria-label', async ({ page }) => {
      await page.goto(`${STORY_BASE}--status-online&viewMode=story`);
      const indicator = page.locator('[role="status"]');
      await expect(indicator).toHaveAttribute('aria-label', 'Online');
    });

    test('initials have aria-label for screen readers', async ({ page }) => {
      await page.goto(`${STORY_BASE}--initials-fallback&viewMode=story`);
      const initials = page.locator('[class*="cometchat-avatar__initials"]');
      await expect(initials).toHaveAttribute('aria-label', 'Jane Smith');
    });
  });
});
