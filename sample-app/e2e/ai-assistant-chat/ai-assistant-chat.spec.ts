import { test, expect, Page } from '@playwright/test';
import { loginToApp, openAIAgentChat } from '../helpers';

/**
 * E2E Tests — CometChatAIAssistantChat (React)
 *
 * Tests the AI assistant chat component rendered for @agentic users.
 * Uses "AI Agent E2E" which must be manually created with role=@agentic.
 *
 * Selectors from:
 *   src/components/CometChatAIAssistantChat/CometChatAIAssistantChat.tsx
 *   src/components/CometChatAIAssistantChat/CometChatAIAssistantChatHistory.tsx
 */

test.describe('CometChatAIAssistantChat', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    const found = await openAIAgentChat(page);
    test.skip(!found, 'AI Agent E2E user not found — create an @agentic user named "AI Agent E2E" in dashboard');
  });

  // ==================== Rendering ====================

  test('AI assistant chat component renders', async () => {
    await expect(page.locator('.cometchat-ai-assistant-chat')).toBeVisible({ timeout: 10_000 });
  });

  test('AI assistant renders with header and composer', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    await expect(aiChat.locator('.cometchat-message-header')).toBeVisible({ timeout: 5_000 });
    await expect(aiChat.locator('.cometchat-ai-assistant-chat__message-composer-view')).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Empty State ====================

  test('empty state shows greeting and intro message', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    const emptyState = aiChat.locator('.cometchat-ai-assistant-chat__empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5_000 });

    // Greeting message
    const greeting = aiChat.locator('.cometchat-ai-assistant-chat__empty-state-greeting-message');
    await expect(greeting).toBeVisible({ timeout: 3_000 });
    const greetingText = await greeting.textContent();
    expect(greetingText?.trim()).toBeTruthy();

    // Intro message
    const intro = aiChat.locator('.cometchat-ai-assistant-chat__empty-state-intro-message');
    await expect(intro).toBeVisible({ timeout: 3_000 });
    const introText = await intro.textContent();
    expect(introText?.trim()).toBeTruthy();
  });

  // ==================== Sending Messages ====================

  test('sending a message triggers AI response', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    const composer = aiChat.locator('.cometchat-ai-assistant-chat__message-composer-view').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('What is CometChat?');

    const sendBtn = aiChat.locator('.cometchat-ai-assistant-chat__send-button-view').first();
    await sendBtn.click();

    // Wait for outgoing message bubble
    await expect(
      aiChat.locator('.cometchat-message-bubble__wrapper--outgoing').first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for AI response (incoming bubble)
    await expect(
      aiChat.locator('.cometchat-message-bubble-incoming').first()
    ).toBeVisible({ timeout: 30_000 });
  });

  // ==================== Header Auxiliary Buttons ====================

  test('new chat button is visible in header', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    await expect(
      aiChat.locator('.cometchat-ai-assistant-chat__icon--new-chat')
    ).toBeVisible({ timeout: 5_000 });
  });

  test('chat history button is visible in header', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    await expect(
      aiChat.locator('.cometchat-ai-assistant-chat__icon--chat-history')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Chat History Sidebar ====================

  test('clicking chat history opens sidebar', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    const historyBtn = aiChat.locator('.cometchat-ai-assistant-chat__icon--chat-history').first();
    await historyBtn.click();
    await page.waitForTimeout(1000);

    // Sidebar becomes visible — check the sidebar element itself (not the --open modifier class)
    const sidebar = page.locator('.cometchat-ai-assistant-chat__sidebar-content').first();
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // History component renders inside
    const historyComponent = page.locator('.cometchat-ai-assistant-chat-history').first();
    await expect(historyComponent).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a history entry loads that conversation', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    // Open history sidebar
    const historyBtn = aiChat.locator('.cometchat-ai-assistant-chat__icon--chat-history').first();
    await historyBtn.click();
    await page.waitForTimeout(2000);

    // Wait for history items to load (or empty state)
    const historyItem = page.locator('.cometchat-ai-assistant-chat-history__item').first();
    const hasItem = await historyItem.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasItem) {
      await historyItem.click();
      await page.waitForTimeout(3000);

      // Empty state should NOT be visible (a conversation is loaded)
      const emptyState = aiChat.locator('.cometchat-ai-assistant-chat__empty-state');
      await expect(emptyState).not.toBeVisible({ timeout: 5_000 });

      // A message bubble should be visible (from the loaded conversation)
      await expect(
        aiChat.locator('.cometchat-message-bubble').first()
      ).toBeVisible({ timeout: 10_000 });
    }
    // If no history items, there are no prior conversations — test passes (nothing to load)
  });

  test('new chat from history opens new empty chat', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    // First, send a message so we have a conversation in history
    const composer = aiChat.locator('.cometchat-ai-assistant-chat__message-composer-view').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Test for history');
    const sendBtn = aiChat.locator('.cometchat-ai-assistant-chat__send-button-view').first();
    await sendBtn.click();
    await page.waitForTimeout(5000);

    // Open history sidebar
    const historyBtn = aiChat.locator('.cometchat-ai-assistant-chat__icon--chat-history').first();
    await historyBtn.click();
    await page.waitForTimeout(2000);

    // Click "New Chat" row in history panel
    const newChatRow = page.locator('.cometchat-ai-assistant-chat-history__new-chat-row').first();
    await expect(newChatRow).toBeVisible({ timeout: 5_000 });
    await newChatRow.click();
    await page.waitForTimeout(2000);

    // Empty state should be visible (new empty chat)
    const emptyState = aiChat.locator('.cometchat-ai-assistant-chat__empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5_000 });
  });

  test('history close button closes the sidebar', async () => {
    const aiChat = page.locator('.cometchat-ai-assistant-chat').first();
    await expect(aiChat).toBeVisible({ timeout: 10_000 });

    // Open history sidebar
    const historyBtn = aiChat.locator('.cometchat-ai-assistant-chat__icon--chat-history').first();
    await historyBtn.click();
    await page.waitForTimeout(1000);

    const sidebarContent = page.locator('.cometchat-ai-assistant-chat__sidebar-content').first();
    await expect(sidebarContent).toBeVisible({ timeout: 5_000 });

    // Click the close button in the history header
    const closeBtn = page.locator('.cometchat-ai-assistant-chat-history__close-btn').first();
    await expect(closeBtn).toBeVisible({ timeout: 3_000 });
    await closeBtn.click();
    await page.waitForTimeout(1000);

    // Sidebar should close (content no longer visible)
    await expect(sidebarContent).not.toBeVisible({ timeout: 5_000 });
  });
});
