import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-audio';

async function gotoStory(page: import('@playwright/test').Page, storyId: string) {
  await page.goto(`${STORY_BASE}--${storyId}&viewMode=story`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

test.describe('CometChatAudioBubble', () => {
  test.describe('Single Audio', () => {
    test('renders play button', async ({ page }) => {
      await gotoStory(page, 'default');
      const playBtn = page.locator('[class*="play-button"]').first();
      await expect(playBtn).toBeVisible({ timeout: 10000 });
    });

    test('renders waveform container', async ({ page }) => {
      await gotoStory(page, 'default');
      const waveform = page.locator('[class*="waveform"]').first();
      await expect(waveform).toBeVisible({ timeout: 10000 });
    });

    test('renders download button', async ({ page }) => {
      await gotoStory(page, 'default');
      const download = page.locator('[class*="download-button"]').first();
      await expect(download).toBeVisible({ timeout: 10000 });
    });

    test('renders incoming audio', async ({ page }) => {
      await gotoStory(page, 'incoming');
      const playBtn = page.locator('[class*="play-button"]').first();
      await expect(playBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Caption', () => {
    test('renders caption below audio', async ({ page }) => {
      await gotoStory(page, 'with-caption');
      const caption = page.locator('[class*="audio-bubble__caption"]').first();
      await expect(caption).toBeVisible();
      await expect(caption).toContainText('meeting');
    });
  });

  test.describe('Conversation', () => {
    test('renders both outgoing and incoming audio bubbles', async ({ page }) => {
      await gotoStory(page, 'conversation');
      const bubbles = page.locator('[role="article"]');
      await expect(bubbles).toHaveCount(2);
    });
  });

  test.describe('Multi-Audio', () => {
    test('shows "Show more" toggle for many audios', async ({ page }) => {
      await gotoStory(page, 'multiple-audios');
      const toggle = page.locator('[class*="toggle-control"]').first();
      await expect(toggle).toBeVisible();
      await expect(toggle).toContainText('Show more');
    });

    test('expands to show all audios on click', async ({ page }) => {
      await gotoStory(page, 'multiple-audios');
      const toggle = page.locator('[class*="toggle-control"]').first();
      await toggle.click();
      await expect(toggle).toContainText('Show less');
    });
  });

  test.describe('Accessibility', () => {
    test('play button has aria-label', async ({ page }) => {
      await gotoStory(page, 'default');
      const playBtn = page.locator('[class*="play-button"]').first();
      await expect(playBtn).toBeVisible({ timeout: 10000 });
      const label = await playBtn.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });

    test('download button has aria-label', async ({ page }) => {
      await gotoStory(page, 'default');
      const download = page.locator('[class*="download-button"]').first();
      await expect(download).toBeVisible({ timeout: 10000 });
      const label = await download.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });
  });

  test.describe('Theme & Layout', () => {
    test('renders in dark theme', async ({ page }) => {
      await gotoStory(page, 'dark-theme');
      const playBtn = page.locator('[class*="play-button"]').first();
      await expect(playBtn).toBeVisible({ timeout: 15000 });
    });

    test('renders in RTL layout', async ({ page }) => {
      await gotoStory(page, 'rtl');
      const playBtn = page.locator('[class*="play-button"]').first();
      await expect(playBtn).toBeVisible({ timeout: 10000 });
    });
  });
});
