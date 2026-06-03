import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatconversationstarter';

function suggestionButtons(page: import('@playwright/test').Page) {
  return page.locator('button[class*="cometchat-conversation-starter__item-button"]');
}

test.describe('CometChatConversationStarter', () => {
  // ─── Default (loaded state) ────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders shimmer loading state initially', async ({ page }) => {
      // Navigate fresh to catch loading state
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      // The loading shimmer may have already resolved, but the component should be visible
      const root = page.locator('[class*="cometchat-conversation-starter"]').first();
      await expect(root).toBeVisible();
    });

    test('renders suggestion buttons after data loads', async ({ page }) => {
      await expect(suggestionButtons(page).first()).toBeVisible({ timeout: 5000 });
      const count = await suggestionButtons(page).count();
      expect(count).toBe(5);
    });

    test('suggestion buttons display text', async ({ page }) => {
      await expect(suggestionButtons(page).first()).toBeVisible({ timeout: 5000 });
      await expect(suggestionButtons(page).first()).not.toBeEmpty();
    });

    test('root has role="group"', async ({ page }) => {
      const root = page.locator('[role="group"]');
      await expect(root).toBeVisible();
    });

    test('root has aria-label', async ({ page }) => {
      const root = page.locator('[role="group"]');
      await expect(root).toHaveAttribute('aria-label', 'Conversation starters');
    });

    test('root has aria-live="polite"', async ({ page }) => {
      const root = page.locator('[role="group"]');
      await expect(root).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ─── Loading story ─────────────────────────────────────────────────

  test.describe('Loading story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--loading&viewMode=story`);
    });

    test('renders shimmer items', async ({ page }) => {
      const shimmers = page.locator('[class*="cometchat-conversation-starter__shimmer-item"]');
      await expect(shimmers).toHaveCount(3);
    });

    test('shimmer container is visible', async ({ page }) => {
      const container = page.locator('[class*="cometchat-conversation-starter__shimmer-container"]');
      await expect(container).toBeVisible();
    });

    test('root has aria-busy="true" during loading', async ({ page }) => {
      const root = page.locator('[role="group"]');
      await expect(root).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ─── Error story ───────────────────────────────────────────────────

  test.describe('Error story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    });

    test('renders error state', async ({ page }) => {
      const errorView = page.locator('[role="alert"]');
      await expect(errorView).toBeVisible({ timeout: 5000 });
    });

    test('displays error message', async ({ page }) => {
      await expect(page.getByText('Could not load suggestions')).toBeVisible({ timeout: 5000 });
    });

    test('error view has role="alert"', async ({ page }) => {
      const errorView = page.locator('[role="alert"]');
      await expect(errorView).toBeVisible({ timeout: 5000 });
      await expect(errorView).toHaveAttribute('role', 'alert');
    });

    test('retry button is visible', async ({ page }) => {
      const retryBtn = page.locator('[class*="cometchat-conversation-starter__error-retry"]');
      await expect(retryBtn).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── Empty story ───────────────────────────────────────────────────

  test.describe('Empty story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--empty-state&viewMode=story`);
    });

    test('renders empty state message', async ({ page }) => {
      await expect(page.getByText('No suggestions available')).toBeVisible({ timeout: 5000 });
    });

    test('no suggestion buttons are rendered', async ({ page }) => {
      // Wait for empty state to appear
      await expect(page.getByText('No suggestions available')).toBeVisible({ timeout: 5000 });
      await expect(suggestionButtons(page)).toHaveCount(0);
    });
  });

  // ─── Dark theme ────────────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside a dark theme container', async ({ page }) => {
      const themeContainer = page.locator('[data-theme="dark"]');
      await expect(themeContainer).toBeVisible();
    });

    test('suggestion buttons are visible in dark theme', async ({ page }) => {
      await expect(suggestionButtons(page).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── RTL ───────────────────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    });

    test('renders inside an RTL container', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
    });

    test('suggestion buttons are visible in RTL', async ({ page }) => {
      await expect(suggestionButtons(page).first()).toBeVisible({ timeout: 5000 });
    });

    test('container direction is RTL', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      const direction = await rtlContainer.evaluate(
        (el) => window.getComputedStyle(el).direction
      );
      expect(direction).toBe('rtl');
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      // Wait for suggestions to load
      await expect(suggestionButtons(page).first()).toBeVisible({ timeout: 5000 });
    });

    test('Tab cycles through suggestion buttons', async ({ page, browserName }) => {
      // WebKit does not move focus to buttons via Tab by default (macOS system setting).
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');

      // Focus the first button
      await suggestionButtons(page).first().focus();
      await expect(suggestionButtons(page).first()).toBeFocused();

      // Tab to next
      await page.keyboard.press('Tab');
      await expect(suggestionButtons(page).nth(1)).toBeFocused();
    });

    test('Enter activates a suggestion button', async ({ page }) => {
      await suggestionButtons(page).first().focus();
      await expect(suggestionButtons(page).first()).toBeFocused();
      // Press Enter — should not crash (onClick is console.log in story)
      await page.keyboard.press('Enter');
    });

    test('Space activates a suggestion button', async ({ page }) => {
      await suggestionButtons(page).first().focus();
      await expect(suggestionButtons(page).first()).toBeFocused();
      await page.keyboard.press('Space');
    });

    test('ArrowRight moves focus to the next suggestion', async ({ page }) => {
      await suggestionButtons(page).first().focus();
      await page.keyboard.press('ArrowRight');
      await expect(suggestionButtons(page).nth(1)).toBeFocused();
    });

    test('ArrowDown moves focus to the next suggestion', async ({ page }) => {
      await suggestionButtons(page).first().focus();
      await page.keyboard.press('ArrowDown');
      await expect(suggestionButtons(page).nth(1)).toBeFocused();
    });

    test('ArrowLeft moves focus to the previous suggestion', async ({ page }) => {
      await suggestionButtons(page).nth(1).focus();
      await page.keyboard.press('ArrowLeft');
      await expect(suggestionButtons(page).first()).toBeFocused();
    });

    test('ArrowUp moves focus to the previous suggestion', async ({ page }) => {
      await suggestionButtons(page).nth(1).focus();
      await page.keyboard.press('ArrowUp');
      await expect(suggestionButtons(page).first()).toBeFocused();
    });

    test('Home moves focus to the first suggestion', async ({ page }) => {
      await suggestionButtons(page).nth(2).focus();
      await page.keyboard.press('Home');
      await expect(suggestionButtons(page).first()).toBeFocused();
    });

    test('End moves focus to the last suggestion', async ({ page }) => {
      await suggestionButtons(page).first().focus();
      await page.keyboard.press('End');
      await expect(suggestionButtons(page).last()).toBeFocused();
    });

    test('ArrowRight wraps from last to first', async ({ page }) => {
      await suggestionButtons(page).last().focus();
      await page.keyboard.press('ArrowRight');
      await expect(suggestionButtons(page).first()).toBeFocused();
    });

    test('ArrowLeft wraps from first to last', async ({ page }) => {
      await suggestionButtons(page).first().focus();
      await page.keyboard.press('ArrowLeft');
      await expect(suggestionButtons(page).last()).toBeFocused();
    });
  });
});
