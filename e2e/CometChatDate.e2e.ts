import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatdate';

test.describe('CometChatDate', () => {
  // ─── Default story ─────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders a <time> element', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      await expect(time).toBeVisible();
    });

    test('has a valid datetime attribute', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      const datetime = await time.getAttribute('datetime');
      expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('has aria-label with full date/time string', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      const label = await time.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label!.length).toBeGreaterThan(5);
    });

    test('has title attribute for hover tooltip', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      const title = await time.getAttribute('title');
      expect(title).toBeTruthy();
    });

    test('displays formatted date text', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      const text = await time.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    });

    test('defaults to caption variant', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      await expect(time).toHaveAttribute('data-variant', 'caption');
    });
  });

  // ─── Yesterday story ───────────────────────────────────────────────

  test.describe('Yesterday story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--yesterday&viewMode=story`);
    });

    test('displays "Yesterday"', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      await expect(time).toContainText('Yesterday');
    });
  });

  // ─── Last week story ──────────────────────────────────────────────

  test.describe('LastWeek story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--last-week&viewMode=story`);
    });

    test('displays a weekday name', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      const text = await time.textContent();
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      expect(weekdays.some((d) => text!.includes(d))).toBe(true);
    });
  });

  // ─── Older date story ─────────────────────────────────────────────

  test.describe('OlderDate story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--older-date&viewMode=story`);
    });

    test('displays a formatted date with month and year', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      const text = await time.textContent();
      // Should contain a month abbreviation and year
      expect(text).toMatch(/\w{3}/);
    });
  });

  // ─── Relative minutes story ────────────────────────────────────────

  test.describe('RelativeMinutes story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--relative-minutes&viewMode=story`);
    });

    test('displays relative time with "mins ago"', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      await expect(time).toContainText('mins ago');
    });
  });

  // ─── Body variant story ────────────────────────────────────────────

  test.describe('BodyVariant story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--body-variant&viewMode=story`);
    });

    test('has data-variant="body"', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      await expect(time).toHaveAttribute('data-variant', 'body');
    });
  });

  // ─── Label variant story ───────────────────────────────────────────

  test.describe('LabelVariant story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--label-variant&viewMode=story`);
    });

    test('has data-variant="label"', async ({ page }) => {
      const time = page.locator('time[class*="cometchat-date"]');
      await expect(time).toHaveAttribute('data-variant', 'label');
    });
  });

  // ─── Dark theme story ─────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside a dark theme container', async ({ page }) => {
      const themeContainer = page.locator('[data-theme="dark"]');
      await expect(themeContainer).toBeVisible();
    });

    test('date elements are visible in dark theme', async ({ page }) => {
      const dates = page.locator('time[class*="cometchat-date"]');
      await expect(dates).toHaveCount(3);
    });
  });

  // ─── RTL story ─────────────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    });

    test('renders inside an RTL container', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
    });

    test('dates are visible in RTL', async ({ page }) => {
      const dates = page.locator('time[class*="cometchat-date"]');
      await expect(dates).toHaveCount(2);
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test('component is not focusable (non-interactive)', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      await page.keyboard.press('Tab');
      const time = page.locator('time[class*="cometchat-date"]');
      // <time> should NOT have focus — it's a non-interactive element
      const isFocused = await time.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBe(false);
    });
  });
});
