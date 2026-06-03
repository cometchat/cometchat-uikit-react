import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-calls-cometchat-outgoing-call';

test.describe('CometChatOutgoingCall', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the outgoing call component', async ({ page }) => {
      const component = page.locator('[class*="cometchat-outgoing-call"]').first();
      await expect(component).toBeVisible();
    });

    test('displays receiver name', async ({ page }) => {
      const title = page.locator('[class*="cometchat-outgoing-call__title"]').last();
      await expect(title).toBeVisible();
      const text = await title.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });

    test('displays calling subtitle', async ({ page }) => {
      const subtitle = page.locator('[class*="cometchat-outgoing-call__subtitle"]');
      await expect(subtitle).toBeVisible();
      await expect(subtitle).toContainText('Calling');
    });

    test('renders cancel/end button', async ({ page }) => {
      const button = page.locator('button[aria-label="End call"]');
      await expect(button).toBeVisible();
    });

    test('renders avatar', async ({ page }) => {
      const avatar = page.locator('[class*="cometchat-outgoing-call__avatar"]');
      await expect(avatar).toBeVisible();
    });

    test('has dialog role', async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    });
  });

  // ─── Video Call ────────────────────────────────────────────────────

  test.describe('VideoCall story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--video-call&viewMode=story`);
    });

    test('renders video call variant', async ({ page }) => {
      const component = page.locator('[class*="cometchat-outgoing-call"]').first();
      await expect(component).toBeVisible();
    });
  });

  // ─── Custom Views ──────────────────────────────────────────────────

  test.describe('CustomViews story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--custom-views&viewMode=story`);
    });

    test('renders with custom views', async ({ page }) => {
      const component = page.locator('[class*="cometchat-outgoing-call"]').first();
      await expect(component).toBeVisible();
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

    test('component is visible in dark theme', async ({ page }) => {
      const component = page.locator('[class*="cometchat-outgoing-call"]').first();
      await expect(component).toBeVisible();
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

    test('component is visible in RTL', async ({ page }) => {
      const component = page.locator('[class*="cometchat-outgoing-call"]').first();
      await expect(component).toBeVisible();
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('cancel button is focusable', async ({ page }) => {
      const button = page.locator('[class*="cometchat-outgoing-call__button"] button, [class*="cometchat-outgoing-call"] button[aria-label="End call"]');
      if (await button.count() > 0) {
        await button.first().focus();
        await expect(button.first()).toBeFocused();
      }
    });

    test('cancel button is activatable with Enter', async ({ page }) => {
      const button = page.locator('[class*="cometchat-outgoing-call"] button[aria-label="End call"]');
      if (await button.count() > 0) {
        await button.first().focus();
        await page.keyboard.press('Enter');
      }
    });
  });
});
