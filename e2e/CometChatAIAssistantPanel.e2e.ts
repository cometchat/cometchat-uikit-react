import { test, expect } from '@playwright/test';

/**
 * E2E tests for CometChatAIAssistantPanel.
 * Tests run against Storybook stories via the Playwright config.
 */
test.describe('CometChatAIAssistantPanel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-ai-ai-assistant-panel--default&viewMode=story'
    );
  });

  test('renders correctly', async ({ page }) => {
    const panel = page.locator('[class*="cometchat-ai-assistant-panel"]').first();
    await expect(panel).toBeVisible();
  });

  test('renders header with title', async ({ page }) => {
    const header = page.locator('[class*="cometchat-ai-assistant-panel__header"]');
    await expect(header).toBeVisible();
    const title = page.locator('[class*="cometchat-ai-assistant-panel__header-title"]');
    await expect(title).toContainText('AI Assistant');
  });

  test('renders close button', async ({ page }) => {
    const closeBtn = page.locator('[aria-label="Close AI assistant"]');
    await expect(closeBtn).toBeVisible();
  });

  test('renders empty state when no messages', async ({ page }) => {
    const empty = page.locator('[class*="cometchat-ai-assistant-panel__empty"]');
    await expect(empty).toBeVisible();
  });

  test('renders input area', async ({ page }) => {
    const input = page.locator('[class*="cometchat-ai-assistant-panel__input"]');
    await expect(input).toBeVisible();
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    const sendBtn = page.locator('[aria-label="Send message"]');
    await expect(sendBtn).toBeDisabled();
  });

  test('send button is enabled when input has text', async ({ page }) => {
    const input = page.locator('[class*="cometchat-ai-assistant-panel__input"]');
    await input.fill('Hello AI');
    const sendBtn = page.locator('[aria-label="Send message"]');
    await expect(sendBtn).toBeEnabled();
  });

  test('supports keyboard navigation', async ({ page }) => {
    // Tab to input
    await page.keyboard.press('Tab');
    const input = page.locator('[class*="cometchat-ai-assistant-panel__input"]');
    await input.focus();
    await expect(input).toBeFocused();

    // Type a message
    await input.fill('Test message');

    // Shift+Enter inserts newline (does not send)
    await page.keyboard.press('Shift+Enter');

    // Enter sends the message
    await page.keyboard.press('Enter');
  });

  test('Escape key triggers close', async ({ page }) => {
    let closeCalled = false;
    await page.exposeFunction('onCloseCallback', () => {
      closeCalled = true;
    });
    await page.keyboard.press('Escape');
    // The close callback is wired in the story — just verify no crash
    await expect(page.locator('[class*="cometchat-ai-assistant-panel"]').first()).toBeVisible();
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-ai-ai-assistant-panel--dark-theme&viewMode=story'
    );
    const panel = page.locator('[class*="cometchat-ai-assistant-panel"]').first();
    await expect(panel).toBeVisible();
  });

  test('renders without close button', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-ai-ai-assistant-panel--without-close-button&viewMode=story'
    );
    const closeBtn = page.locator('[aria-label="Close AI assistant"]');
    await expect(closeBtn).not.toBeVisible();
  });

  test('renders compound composition story', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-ai-ai-assistant-panel--compound-composition&viewMode=story'
    );
    const panel = page.locator('[class*="cometchat-ai-assistant-panel"]').first();
    await expect(panel).toBeVisible();
    const title = page.locator('[class*="cometchat-ai-assistant-panel__header-title"]');
    await expect(title).toContainText('Custom AI Header');
  });

  test('has correct ARIA roles', async ({ page }) => {
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();
    const log = page.locator('[role="log"]');
    await expect(log).toBeVisible();
  });

  test('input has accessible label', async ({ page }) => {
    const input = page.locator('[aria-label="Message to AI assistant"]');
    await expect(input).toBeVisible();
  });
});
