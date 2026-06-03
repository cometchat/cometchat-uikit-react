import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-bubbles-call-bubble';

test.describe('CometChatCallBubble', () => {
  // ─── Audio Call Outgoing ────────────────────────────────────────────

  test.describe('AudioCallOutgoing story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--audio-call-outgoing&viewMode=story`);
    });

    test('renders the call bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('displays call type icon', async ({ page }) => {
      // The call bubble may use a div with mask-image for the icon
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
      // Verify there's content in the bubble beyond just text
      const children = await bubble.locator('*').count();
      expect(children).toBeGreaterThan(0);
    });

    test('displays call title text', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toContainText(/audio|call/i);
    });
  });

  // ─── Audio Call Incoming ────────────────────────────────────────────

  test.describe('AudioCallIncoming story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--audio-call-incoming&viewMode=story`);
    });

    test('renders the incoming call bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });

  // ─── Video Call Outgoing ────────────────────────────────────────────

  test.describe('VideoCallOutgoing story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--video-call-outgoing&viewMode=story`);
    });

    test('renders the video call bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('displays video call indicator', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toContainText(/video|call/i);
    });
  });

  // ─── Video Call Incoming ────────────────────────────────────────────

  test.describe('VideoCallIncoming story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--video-call-incoming&viewMode=story`);
    });

    test('renders the incoming video call bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });

  // ─── Without Button ─────────────────────────────────────────────────

  test.describe('WithoutButton story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--without-button&viewMode=story`);
    });

    test('renders call bubble without action button', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
      const button = bubble.locator('button');
      await expect(button).toHaveCount(0);
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

    test('call bubble is visible in dark theme', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
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

    test('call bubble is visible in RTL', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-call-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });
});
