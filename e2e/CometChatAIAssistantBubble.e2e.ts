import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-ai-ai-assistant-bubble';

test.describe('CometChatAIAssistantBubble', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the AI assistant bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-ai-assistant-bubble"], [class*="cometchat-ai-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('displays AI response text', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-ai-assistant-bubble"], [class*="cometchat-ai-bubble"]').first();
      const text = await bubble.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  // ─── With Markdown ─────────────────────────────────────────────────

  test.describe('WithMarkdown story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-markdown&viewMode=story`);
    });

    test('renders markdown content', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-ai-assistant-bubble"], [class*="cometchat-ai-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders formatted elements (bold, lists, etc.)', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-ai-assistant-bubble"]').first();
      await expect(bubble).toBeVisible();
      // The markdown content renders into __content div with formatted HTML
      const content = bubble.locator('[class*="content"]');
      const html = await content.innerHTML();
      // Markdown should produce some HTML formatting (strong, em, p, ul, ol, h, code, etc.)
      const hasFormatting = /<(strong|em|b|i|ul|ol|li|h[1-6]|p|code|pre|a)\b/.test(html);
      expect(hasFormatting).toBeTruthy();
    });
  });

  // ─── With Code ─────────────────────────────────────────────────────

  test.describe('WithCode story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-code&viewMode=story`);
    });

    test('renders code block', async ({ page }) => {
      const codeBlock = page.locator('[class*="cometchat-ai-assistant-bubble"] code, [class*="cometchat-ai-assistant-bubble"] pre, [class*="cometchat-ai-bubble"] code, [class*="cometchat-ai-bubble"] pre');
      await expect(codeBlock.first()).toBeVisible();
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

    test('bubble is visible in dark theme', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-ai-assistant-bubble"], [class*="cometchat-ai-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });
});
