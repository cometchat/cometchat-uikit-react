import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatcontextmenu';

test.describe('CometChatContextMenu', () => {
  // ─── Default story ─────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders top-row items and trigger button', async ({ page }) => {
      const root = page.locator('[class*="cometchat-context-menu"]').first();
      await expect(root).toBeVisible();
      // 2 top-row items + 1 trigger = 3 buttons visible.
      const buttons = root.locator('button');
      await expect(buttons).toHaveCount(3);
    });

    test('opens dropdown on trigger click', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      const menu = page.locator('[role="menu"]');
      await expect(menu).toBeVisible();
    });

    test('closes dropdown on outside click', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      await expect(page.locator('[role="menu"]')).toBeVisible();
      await page.mouse.click(10, 10);
      await expect(page.locator('[role="menu"]')).toBeHidden();
    });

    test('selects a dropdown item', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      const items = page.locator('[role="menuitem"]');
      await items.first().click();
      // Dropdown should close after selection.
      await expect(page.locator('[role="menu"]')).toBeHidden();
    });
  });

  // ─── Dark theme ────────────────────────────────────────────────────

  test.describe('Dark theme', () => {
    test('renders in dark theme', async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
      const root = page.locator('[class*="cometchat-context-menu"]').first();
      await expect(root).toBeVisible();
    });
  });

  // ─── RTL ───────────────────────────────────────────────────────────

  test.describe('RTL', () => {
    test('renders in RTL', async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
      const root = page.locator('[class*="cometchat-context-menu"]').first();
      await expect(root).toBeVisible();
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('Tab cycles through top-row items and trigger', async ({ page, browserName }) => {
      // WebKit on macOS does not move focus between buttons via Tab by default
      // (requires system-level "Press Tab to highlight each item" setting).
      // This is a platform behavior, not a component bug.
      test.skip(browserName === 'webkit', 'WebKit/macOS does not Tab between buttons by default');

      const firstTopItem = page.getByRole('button', { name: 'React' });
      await firstTopItem.focus();
      await expect(firstTopItem).toBeFocused();

      await page.keyboard.press('Tab');
      const secondTopItem = page.getByRole('button', { name: 'Reply' });
      await expect(secondTopItem).toBeFocused();

      await page.keyboard.press('Tab');
      const trigger = page.getByRole('button', { name: 'More options' });
      await expect(trigger).toBeFocused();
    });

    test('Enter on trigger opens dropdown', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[role="menu"]')).toBeVisible();
    });

    test('Space on trigger opens dropdown', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.focus();
      await page.keyboard.press('Space');
      await expect(page.locator('[role="menu"]')).toBeVisible();
    });

    test('ArrowDown/ArrowUp navigates dropdown items', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      await expect(page.locator('[role="menu"]')).toBeVisible();

      const items = page.locator('[role="menuitem"]');
      // First item should be focused after open.
      await expect(items.first()).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(items.nth(1)).toBeFocused();

      await page.keyboard.press('ArrowUp');
      await expect(items.first()).toBeFocused();
    });

    test('Enter selects focused dropdown item', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      const items = page.locator('[role="menuitem"]');
      await expect(items.first()).toBeFocused();
      await page.keyboard.press('Enter');
      // Dropdown should close.
      await expect(page.locator('[role="menu"]')).toBeHidden();
    });

    test('Escape closes dropdown and returns focus to trigger', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      await expect(page.locator('[role="menu"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="menu"]')).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test('Home/End jump to first/last dropdown item', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      const items = page.locator('[role="menuitem"]');
      // Wait for focus to settle on first item after open.
      await expect(items.first()).toBeFocused();

      await page.keyboard.press('End');
      await expect(items.last()).toBeFocused();

      await page.keyboard.press('Home');
      await expect(items.first()).toBeFocused();
    });

    test('Focus trap: Tab stays within dropdown', async ({ page }) => {
      const trigger = page.locator('button[aria-haspopup="true"]');
      await trigger.click();
      const items = page.locator('[role="menuitem"]');
      // Wait for focus to settle on first item.
      await expect(items.first()).toBeFocused();

      // Navigate to last item via End.
      await page.keyboard.press('End');
      await expect(items.last()).toBeFocused();

      // Tab should wrap to first.
      await page.keyboard.press('Tab');
      await expect(items.first()).toBeFocused();

      // Shift+Tab should wrap to last.
      await page.keyboard.press('Shift+Tab');
      await expect(items.last()).toBeFocused();
    });
  });
});
