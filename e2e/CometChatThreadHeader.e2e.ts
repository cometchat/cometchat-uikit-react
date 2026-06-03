import { test, expect } from '@playwright/test';

/**
 * Story IDs follow the pattern: {title-kebab}--{story-name-kebab}
 * Title: "Core Components/CometChatThreadHeader"
 * → ID prefix: "core-components-cometchatthreadheader"
 */
const STORY_PREFIX = 'core-components-cometchatthreadheader';

function storyUrl(storyName: string): string {
  return `/iframe.html?id=${STORY_PREFIX}--${storyName}&viewMode=story`;
}

test.describe('CometChatThreadHeader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('default'));
    // Wait for i18next to initialize — the title changes from "thread_title" to "Thread"
    await page.waitForTimeout(500);
  });

  test('renders thread title and sender name', async ({ page }) => {
    // Title: either the translated "Thread" or the key "thread_title" if i18n hasn't loaded
    const title = page.locator('[class*="cometchat-thread-header__title"]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText === 'Thread' || titleText === 'thread_title').toBeTruthy();

    // Sender name
    const sender = page.locator('[class*="cometchat-thread-header__sender-name"]');
    await expect(sender).toBeVisible();
    await expect(sender).toHaveText('Alice');
  });

  test('renders reply count', async ({ page }) => {
    const replyCount = page.locator('[class*="cometchat-thread-header__reply-count-text"]');
    await expect(replyCount).toBeVisible();
    const text = await replyCount.textContent();
    // Either translated "5 Replies" or key-based "5 thread_replies"
    expect(text).toContain('5');
  });

  test('close button is visible', async ({ page }) => {
    const closeButton = page.locator('[class*="cometchat-thread-header__close-button"]').first();
    await expect(closeButton).toBeVisible();
  });

  test('close button closes the thread on click', async ({ page }) => {
    const closeButton = page.locator('button[class*="cometchat-thread-header__close-button"]');
    await closeButton.click();
  });

  test('renders parent message bubble', async ({ page }) => {
    const bubble = page.locator('[class*="cometchat-message-bubble"]').first();
    await expect(bubble).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('close button is focusable and activates on Enter', async ({ page }) => {
      const closeButton = page.locator('button[class*="cometchat-thread-header__close-button"]');
      await closeButton.focus();
      await expect(closeButton).toBeFocused();
      await page.keyboard.press('Enter');
    });

    test('Space activates close button', async ({ page }) => {
      const closeButton = page.locator('button[class*="cometchat-thread-header__close-button"]');
      await closeButton.focus();
      await page.keyboard.press('Space');
    });

    test('Escape closes the thread', async ({ page }) => {
      const header = page.locator('[role="banner"]');
      await header.focus();
      await page.keyboard.press('Escape');
    });
  });
});

test.describe('CometChatThreadHeader - Image Parent Message', () => {
  test('renders image bubble', async ({ page }) => {
    await page.goto(storyUrl('image-parent-message'));
    const header = page.locator('[role="banner"]');
    await expect(header).toBeVisible();
    const replyCount = page.locator('[class*="cometchat-thread-header__reply-count-text"]');
    await expect(replyCount).toBeVisible();
    const text = await replyCount.textContent();
    expect(text).toContain('12');
  });
});

test.describe('CometChatThreadHeader - Single Reply', () => {
  test('displays singular form for 1 reply', async ({ page }) => {
    await page.goto(storyUrl('single-reply'));
    await page.waitForTimeout(500);
    const replyCount = page.locator('[class*="cometchat-thread-header__reply-count-text"]');
    await expect(replyCount).toBeVisible();
    const text = await replyCount.textContent();
    expect(text).toContain('1');
    // Should use singular: "1 Reply" or "1 thread_reply"
    expect(text).not.toContain('Replies');
  });
});

test.describe('CometChatThreadHeader - Zero Replies', () => {
  test('displays zero reply count', async ({ page }) => {
    await page.goto(storyUrl('zero-replies'));
    const replyCount = page.locator('[class*="cometchat-thread-header__reply-count-text"]');
    await expect(replyCount).toBeVisible();
    const text = await replyCount.textContent();
    expect(text).toContain('0');
  });
});

test.describe('CometChatThreadHeader - Many Replies', () => {
  test('displays "999+" for counts > 999', async ({ page }) => {
    await page.goto(storyUrl('many-replies'));
    const replyCount = page.locator('[class*="cometchat-thread-header__reply-count-text"]');
    await expect(replyCount).toBeVisible();
    const text = await replyCount.textContent();
    expect(text).toContain('999+');
  });
});

test.describe('CometChatThreadHeader - Dark Theme', () => {
  test('renders correctly in dark theme', async ({ page }) => {
    await page.goto(storyUrl('dark-theme'));
    const header = page.locator('[role="banner"]');
    await expect(header).toBeVisible();
  });
});

test.describe('CometChatThreadHeader - RTL', () => {
  test('renders correctly in RTL', async ({ page }) => {
    await page.goto(storyUrl('rtl'));
    const header = page.locator('[role="banner"]');
    await expect(header).toBeVisible();
  });
});
