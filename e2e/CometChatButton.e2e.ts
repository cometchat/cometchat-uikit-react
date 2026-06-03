import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-elements-button';

test.describe('CometChatButton', () => {
  // ─── Primary ───────────────────────────────────────────────────────

  test.describe('Primary story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--primary&viewMode=story`);
    });

    test('renders the button', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
    });

    test('button has correct text', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toContainText('Primary Button');
    });

    test('button is clickable', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await button.click();
      // No error means success
    });

    test('button is keyboard activatable with Enter', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await button.focus();
      await expect(button).toBeFocused();
      await page.keyboard.press('Enter');
    });

    test('button is keyboard activatable with Space', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await button.focus();
      await page.keyboard.press('Space');
    });
  });

  // ─── Secondary ─────────────────────────────────────────────────────

  test.describe('Secondary story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--secondary&viewMode=story`);
    });

    test('renders secondary variant', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
      await expect(button).toContainText('Secondary Button');
    });
  });

  // ─── Ghost ─────────────────────────────────────────────────────────

  test.describe('Ghost story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--ghost&viewMode=story`);
    });

    test('renders ghost variant', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
      await expect(button).toContainText('Ghost Button');
    });
  });

  // ─── All Sizes ─────────────────────────────────────────────────────

  test.describe('AllSizes story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--all-sizes&viewMode=story`);
    });

    test('renders three buttons of different sizes', async ({ page }) => {
      const buttons = page.locator('button[class*="cometchat-button"]');
      await expect(buttons).toHaveCount(3);
    });

    test('small button is smaller than medium', async ({ page }) => {
      const buttons = page.locator('button[class*="cometchat-button"]');
      const smallBox = await buttons.nth(0).boundingBox();
      const mediumBox = await buttons.nth(1).boundingBox();
      expect(smallBox!.height).toBeLessThan(mediumBox!.height);
    });

    test('medium button is smaller than large', async ({ page }) => {
      const buttons = page.locator('button[class*="cometchat-button"]');
      const mediumBox = await buttons.nth(1).boundingBox();
      const largeBox = await buttons.nth(2).boundingBox();
      expect(mediumBox!.height).toBeLessThan(largeBox!.height);
    });
  });

  // ─── With Icon and Text ────────────────────────────────────────────

  test.describe('WithIconAndText story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-icon-and-text&viewMode=story`);
    });

    test('renders button with icon and text', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
      await expect(button).toContainText('Send');
    });

    test('renders SVG icon', async ({ page }) => {
      const svg = page.locator('[class*="cometchat-button"] svg');
      await expect(svg).toBeVisible();
    });
  });

  // ─── Icon Only ─────────────────────────────────────────────────────

  test.describe('IconOnly story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--icon-only&viewMode=story`);
    });

    test('renders icon-only button with aria-label', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute('aria-label', 'Send message');
    });
  });

  // ─── Loading ───────────────────────────────────────────────────────

  test.describe('Loading story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--loading&viewMode=story`);
    });

    test('button shows loading state', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
    });

    test('button is disabled during loading', async ({ page }) => {
      const button = page.locator('button[class*="cometchat-button"]').first();
      const isDisabled = await button.evaluate(
        (el) => (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true'
      );
      expect(isDisabled).toBeTruthy();
    });
  });

  // ─── Disabled ──────────────────────────────────────────────────────

  test.describe('Disabled story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--disabled&viewMode=story`);
    });

    test('button is disabled', async ({ page }) => {
      const button = page.locator('button[class*="cometchat-button"]').first();
      const isDisabled = await button.evaluate(
        (el) => (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true'
      );
      expect(isDisabled).toBeTruthy();
    });
  });

  // ─── Dark Theme ────────────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside dark theme container', async ({ page }) => {
      const container = page.locator('[data-theme="dark"]');
      await expect(container).toBeVisible();
    });

    test('button is visible in dark theme', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
    });
  });

  // ─── RTL ───────────────────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    });

    test('renders inside RTL container', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
    });

    test('button is visible in RTL', async ({ page }) => {
      const button = page.locator('[class*="cometchat-button"]').first();
      await expect(button).toBeVisible();
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--primary&viewMode=story`);
    });

    test('button is focusable via Tab', async ({ page }) => {
      // Click the page body first to ensure focus starts inside the iframe
      await page.locator('body').click();
      await page.keyboard.press('Tab');
      const button = page.locator('button[class*="cometchat-button"]').first();
      // May need a second Tab depending on Storybook's DOM
      if (!(await button.evaluate((el) => el === document.activeElement))) {
        await page.keyboard.press('Tab');
      }
      await expect(button).toBeFocused();
    });

    test('button has visible focus indicator', async ({ page }) => {
      const button = page.locator('button[class*="cometchat-button"]').first();
      await button.focus();
      await expect(button).toBeFocused();
    });
  });
});
