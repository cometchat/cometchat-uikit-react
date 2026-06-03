import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-ai-ai-assistant-chat';

/**
 * CometChatAIAssistantChat requires CometChat SDK to be initialized.
 * The Storybook stories crash because there's no SDK context in isolation.
 * These tests are marked as fixme until the stories mock the SDK properly.
 */
test.describe('CometChatAIAssistantChat', () => {
  test.fixme('renders the AI assistant chat component', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const component = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(component).toBeVisible();
  });

  test.fixme('renders a text input area', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('.cometchat-ai-assistant-chat [contenteditable="true"], .cometchat-ai-assistant-chat textarea').first();
    await expect(input).toBeVisible();
  });

  test.fixme('renders a send button', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const sendBtn = page.locator('.cometchat-ai-assistant-chat__send-button-view').first();
    await expect(sendBtn).toBeVisible();
  });

  test.fixme('input is focusable and typeable', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('.cometchat-ai-assistant-chat [contenteditable="true"], .cometchat-ai-assistant-chat textarea').first();
    await input.click();
    await page.keyboard.type('Hello AI');
  });

  test.fixme('renders with tools available', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-tools&viewMode=story`);
    const component = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(component).toBeVisible();
  });

  test.fixme('renders without chat history button', async ({ page }) => {
    await page.goto(`${STORY_BASE}--without-history&viewMode=story`);
    const component = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(component).toBeVisible();
  });

  test.fixme('displays suggestion pills', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-custom-suggestions&viewMode=story`);
    const suggestions = page.locator('.cometchat-ai-assistant-chat__suggested-message-pill');
    const count = await suggestions.count();
    expect(count).toBeGreaterThan(0);
  });

  test.fixme('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const container = page.locator('[data-theme="dark"]');
    await expect(container).toBeVisible();
  });

  test.fixme('Enter submits message', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('.cometchat-ai-assistant-chat [contenteditable="true"], .cometchat-ai-assistant-chat textarea').first();
    await input.click();
    await page.keyboard.type('Test message');
    await page.keyboard.press('Enter');
  });
});
