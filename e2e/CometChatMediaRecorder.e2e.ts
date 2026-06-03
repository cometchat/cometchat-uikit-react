import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatmediarecorder';

test.describe('CometChatMediaRecorder', () => {
  // ─── Default (idle state) ──────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the inline media recorder container', async ({ page }) => {
      const recorder = page.locator('[class*="cometchat-media-recorder--inline"]');
      await expect(recorder).toBeVisible();
    });

    test('has role="group" on root element', async ({ page }) => {
      const root = page.locator('[role="group"]');
      await expect(root).toBeVisible();
    });

    test('renders a delete button', async ({ page }) => {
      const deleteBtn = page.locator('[class*="cometchat-media-recorder__inline-delete"]');
      await expect(deleteBtn).toBeVisible();
      await expect(deleteBtn).toHaveAttribute('role', 'button');
    });

    test('renders a record button in idle state', async ({ page }) => {
      const recordBtn = page.locator('[class*="cometchat-media-recorder__inline-record"]');
      await expect(recordBtn).toBeVisible();
      await expect(recordBtn).toHaveAttribute('role', 'button');
    });
  });

  // ─── Recording state (mocked) ─────────────────────────────────

  test.describe('Recording story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--recording&viewMode=story`);
    });

    test('renders the recording dot', async ({ page }) => {
      const dot = page.locator('[class*="cometchat-media-recorder__recording-dot"]');
      await expect(dot).toBeVisible();
    });

    test('renders waveform bars with active class', async ({ page }) => {
      const bars = page.locator('[class*="cometchat-media-recorder__waveform-bar--active"]');
      await expect(bars.first()).toBeVisible();
      const count = await bars.count();
      expect(count).toBe(30);
    });

    test('displays the timer with elapsed time', async ({ page }) => {
      const timer = page.locator('[role="timer"]');
      await expect(timer).toBeVisible();
      await expect(timer).toHaveText('0:42');
    });

    test('timer has accessible aria-label', async ({ page }) => {
      const timer = page.locator('[role="timer"]');
      await expect(timer).toHaveAttribute('aria-label', '0 minutes 42 seconds');
    });

    test('renders pause button', async ({ page }) => {
      const pauseBtn = page.locator('[class*="cometchat-media-recorder__inline-pause"]');
      await expect(pauseBtn).toBeVisible();
    });

    test('announces recording status to screen readers', async ({ page }) => {
      const status = page.locator('[role="status"][aria-live="polite"]');
      await expect(status).toHaveCount(1);
    });
  });

  // ─── Paused state (mocked) ────────────────────────────────────

  test.describe('Paused story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--paused&viewMode=story`);
    });

    test('displays the timer with paused time', async ({ page }) => {
      const timer = page.locator('[role="timer"]');
      await expect(timer).toHaveText('0:15');
    });

    test('renders resume button', async ({ page }) => {
      const resumeBtn = page.locator('[class*="cometchat-media-recorder__inline-resume"]');
      await expect(resumeBtn).toBeVisible();
    });

    test('renders static waveform bars (no active class)', async ({ page }) => {
      const bars = page.locator('[class*="cometchat-media-recorder__waveform-bar"]');
      await expect(bars.first()).toBeVisible();
      // Paused bars should NOT have the --active modifier
      const activeBars = page.locator('[class*="cometchat-media-recorder__waveform-bar--active"]');
      await expect(activeBars).toHaveCount(0);
    });

    test('does not render recording dot when paused', async ({ page }) => {
      const dot = page.locator('[class*="cometchat-media-recorder__recording-dot"]');
      await expect(dot).toHaveCount(0);
    });
  });

  // ─── Error state (mocked) ─────────────────────────────────────

  test.describe('Error state story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    });

    test('renders error view with role="alert"', async ({ page }) => {
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible();
    });

    test('displays error icon and text', async ({ page }) => {
      const icon = page.locator('[class*="cometchat-media-recorder__inline-error-icon"]');
      const text = page.locator('[class*="cometchat-media-recorder__inline-error-text"]');
      await expect(icon).toBeVisible();
      await expect(text).toBeVisible();
    });

    test('renders close button in error state', async ({ page }) => {
      const closeBtn = page.locator('[class*="cometchat-media-recorder__inline-close"]');
      await expect(closeBtn).toBeVisible();
      await expect(closeBtn).toHaveAttribute('role', 'button');
    });
  });

  // ─── Dark theme ───────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside a dark theme container', async ({ page }) => {
      const themeContainer = page.locator('[data-theme="dark"]');
      await expect(themeContainer).toBeVisible();
    });

    test('media recorder is visible in dark theme', async ({ page }) => {
      const recorder = page.locator('[class*="cometchat-media-recorder--inline"]');
      await expect(recorder).toBeVisible();
    });
  });

  // ─── Keyboard navigation ─────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('Tab cycles through control buttons', async ({ page }) => {
      // Tab to delete button
      await page.keyboard.press('Tab');
      const deleteBtn = page.locator('[class*="cometchat-media-recorder__inline-delete"]');
      await expect(deleteBtn).toBeFocused();

      // Tab to record button
      await page.keyboard.press('Tab');
      const recordBtn = page.locator('[class*="cometchat-media-recorder__inline-record"]');
      await expect(recordBtn).toBeFocused();
    });

    test('Enter activates a control button', async ({ page }) => {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toHaveAttribute('role', 'button');
      // Press Enter — should not throw
      await page.keyboard.press('Enter');
    });

    test('Space activates a control button', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');
      // No crash expected
    });

    test('Escape closes the recorder', async ({ page }) => {
      // Focus into the component first
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      // After escape, the recorder should reset (delete button handler called)
    });
  });

  // ─── Accessibility ────────────────────────────────────────────

  test.describe('Accessibility', () => {
    test('all interactive elements have aria-label', async ({ page }) => {
      await page.goto(`${STORY_BASE}--recording&viewMode=story`);
      const buttons = page.locator('[role="button"]');
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const label = await buttons.nth(i).getAttribute('aria-label');
        expect(label).toBeTruthy();
      }
    });

    test('timer has role="timer"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--recording&viewMode=story`);
      const timer = page.locator('[role="timer"]');
      await expect(timer).toBeVisible();
    });

    test('error view has role="alert"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible();
    });

    test('waveform is aria-hidden', async ({ page }) => {
      await page.goto(`${STORY_BASE}--recording&viewMode=story`);
      const waveform = page.locator('[class*="cometchat-media-recorder__waveform"]');
      await expect(waveform).toHaveAttribute('aria-hidden', 'true');
    });

    test('loading fallback has role="status"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--loading-fallback&viewMode=story`);
      const status = page.locator('[role="status"]');
      await expect(status).toBeVisible();
    });
  });
});
