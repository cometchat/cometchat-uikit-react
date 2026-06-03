import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-cometchatmessagecomposer';

test.describe('CometChatMessageComposer', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the composer', async ({ page }) => {
      const composer = page.locator('[class*="cometchat-message-composer"]').first();
      await expect(composer).toBeVisible();
    });

    test('renders text input area', async ({ page }) => {
      const input = page.locator('[class*="cometchat-message-composer"] [contenteditable="true"], [class*="cometchat-message-composer"] textarea, [class*="cometchat-message-composer"] input[type="text"]');
      await expect(input.first()).toBeVisible();
    });

    test('renders send button', async ({ page }) => {
      const sendBtn = page.locator('[class*="cometchat-message-composer"] [class*="send"], [class*="cometchat-message-composer"] button[aria-label*="send" i]');
      await expect(sendBtn.first()).toBeVisible();
    });

    test('input is focusable', async ({ page }) => {
      const input = page.locator('[class*="cometchat-message-composer"] [contenteditable="true"], [class*="cometchat-message-composer"] textarea');
      await input.first().click();
      await expect(input.first()).toBeFocused();
    });

    test('can type text into the input', async ({ page }) => {
      const input = page.locator('[class*="cometchat-message-composer"] [contenteditable="true"], [class*="cometchat-message-composer"] textarea');
      await input.first().click();
      await page.keyboard.type('Hello world');
      const text = await input.first().textContent();
      expect(text).toContain('Hello world');
    });
  });

  // ─── Multiline Layout ──────────────────────────────────────────────

  test.describe('MultilineLayout story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--multiline-layout&viewMode=story`);
    });

    test('renders multiline composer', async ({ page }) => {
      const composer = page.locator('[class*="cometchat-message-composer"]').first();
      await expect(composer).toBeVisible();
    });
  });

  // ─── With Initial Text ─────────────────────────────────────────────

  test.describe('WithInitialText story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-initial-text&viewMode=story`);
    });

    test('renders with pre-filled text', async ({ page }) => {
      const input = page.locator('[class*="cometchat-message-composer"] [contenteditable="true"], [class*="cometchat-message-composer"] textarea');
      const text = await input.first().textContent();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  // ─── Rich Text Editor ──────────────────────────────────────────────

  test.describe('RichTextEditor story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rich-text-editor&viewMode=story`);
    });

    test('renders rich text composer with formatting toolbar', async ({ page }) => {
      const composer = page.locator('[class*="cometchat-message-composer"]').first();
      await expect(composer).toBeVisible();
      const toolbar = page.locator('[class*="formatting-toolbar"], [class*="cometchat-formatting-toolbar"]');
      await expect(toolbar.first()).toBeVisible();
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

    test('composer is visible in dark theme', async ({ page }) => {
      const composer = page.locator('[class*="cometchat-message-composer"]').first();
      await expect(composer).toBeVisible();
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

    test('composer is visible in RTL', async ({ page }) => {
      const composer = page.locator('[class*="cometchat-message-composer"]').first();
      await expect(composer).toBeVisible();
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('Tab navigates through composer elements', async ({ page }) => {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('input supports Shift+Enter for newline', async ({ page }) => {
      const input = page.locator('[class*="cometchat-message-composer"] [contenteditable="true"], [class*="cometchat-message-composer"] textarea');
      await input.first().click();
      await page.keyboard.type('Line 1');
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.type('Line 2');
      const text = await input.first().textContent();
      expect(text).toContain('Line 1');
      expect(text).toContain('Line 2');
    });
  });
});
