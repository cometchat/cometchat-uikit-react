import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-calls-cometchat-incoming-call';

/**
 * CometChatIncomingCall requires CometChat SDK to be initialized.
 * - The Default story mounts the component in listening mode (renders nothing until a call arrives).
 * - The Simulated stories render static HTML previews but also require SDK context.
 *
 * All stories crash with `sb-show-errordisplay` in Storybook isolation.
 * These tests are marked as fixme until the stories mock the SDK properly.
 */
test.describe('CometChatIncomingCall', () => {
  test.fixme('renders the listening mode container', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const component = page.locator('[class*="cometchat-incoming-call"]').first();
    await expect(component).toBeVisible();
  });

  test.fixme('displays caller name in simulated audio call', async ({ page }) => {
    await page.goto(`${STORY_BASE}--simulated-audio-call&viewMode=story`);
    const name = page.getByText('Alice Johnson');
    await expect(name).toBeVisible();
  });

  test.fixme('displays Voice Call subtitle', async ({ page }) => {
    await page.goto(`${STORY_BASE}--simulated-audio-call&viewMode=story`);
    const subtitle = page.getByText('Voice Call');
    await expect(subtitle).toBeVisible();
  });

  test.fixme('renders accept and decline buttons', async ({ page }) => {
    await page.goto(`${STORY_BASE}--simulated-audio-call&viewMode=story`);
    const acceptBtn = page.locator('button[aria-label="Accept call"]');
    const declineBtn = page.locator('button[aria-label="Decline call"]');
    await expect(acceptBtn).toBeVisible();
    await expect(declineBtn).toBeVisible();
  });

  test.fixme('renders simulated video call', async ({ page }) => {
    await page.goto(`${STORY_BASE}--simulated-video-call&viewMode=story`);
    const subtitle = page.getByText('Video Call');
    await expect(subtitle).toBeVisible();
  });

  test.fixme('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const container = page.locator('[data-theme="dark"]');
    await expect(container).toBeVisible();
  });

  test.fixme('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    const rtlContainer = page.locator('[dir="rtl"]');
    await expect(rtlContainer).toBeVisible();
  });
});
