import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-cometchatsearch';

/**
 * CometChatSearch requires CometChat SDK to be initialized via CometChatProvider.
 * The Storybook stories crash with `sb-show-errordisplay` because there's no
 * SDK context in isolation. These tests are marked as fixme until the stories
 * are updated to mock the SDK context.
 */
test.describe('CometChatSearch', () => {
  test.fixme('renders the search component', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const component = page.locator('[role="search"]').first();
    await expect(component).toBeVisible();
  });

  test.fixme('renders search input', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('[role="search"] input').first();
    await expect(input).toBeVisible();
  });

  test.fixme('search input is focusable', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('[role="search"] input').first();
    await input.click();
    await expect(input).toBeFocused();
  });

  test.fixme('can type in search input', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('[role="search"] input').first();
    await input.click();
    await page.keyboard.type('test query');
    await expect(input).toHaveValue('test query');
  });

  test.fixme('renders with active filter', async ({ page }) => {
    await page.goto(`${STORY_BASE}--with-active-filter&viewMode=story`);
    const component = page.locator('[role="search"]').first();
    await expect(component).toBeVisible();
  });

  test.fixme('renders loading state', async ({ page }) => {
    await page.goto(`${STORY_BASE}--loading-state&viewMode=story`);
    const loading = page.locator('[aria-busy="true"]').first();
    await expect(loading).toBeVisible();
  });

  test.fixme('renders empty state', async ({ page }) => {
    await page.goto(`${STORY_BASE}--empty-state&viewMode=story`);
    const empty = page.locator('[aria-live="assertive"]').first();
    await expect(empty).toBeVisible();
  });

  test.fixme('renders error state', async ({ page }) => {
    await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    const error = page.locator('[aria-live="assertive"]').first();
    await expect(error).toBeVisible();
  });

  test.fixme('renders conversation results', async ({ page }) => {
    await page.goto(`${STORY_BASE}--conversations-results&viewMode=story`);
    const results = page.locator('[role="list"]').first();
    await expect(results).toBeVisible();
  });

  test.fixme('renders message results', async ({ page }) => {
    await page.goto(`${STORY_BASE}--messages-results&viewMode=story`);
    const results = page.locator('[role="list"]').first();
    await expect(results).toBeVisible();
  });

  test.fixme('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    const component = page.locator('[role="search"]').first();
    await expect(component).toBeVisible();
  });

  test.fixme('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    const component = page.locator('[role="search"]').first();
    await expect(component).toBeVisible();
  });

  test.fixme('Escape clears search input', async ({ page }) => {
    await page.goto(`${STORY_BASE}--default&viewMode=story`);
    const input = page.locator('[role="search"] input').first();
    await input.click();
    await page.keyboard.type('test');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
  });
});
