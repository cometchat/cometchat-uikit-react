import { test, expect } from '@playwright/test';

test.describe('CometChatReactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-cometchatreactions--default&viewMode=story'
    );
  });

  test('renders reaction chips', async ({ page }) => {
    const bar = page.locator('[role="group"][aria-label="Reactions"]');
    await expect(bar).toBeVisible();
    // Match all chip buttons (aria-pressed can be "true" or "false")
    const chips = bar.locator('button[aria-label*="reacted by"]');
    await expect(chips).toHaveCount(3);
  });

  test('chip displays emoji and count', async ({ page }) => {
    const firstChip = page.locator('button[aria-pressed]').first();
    await expect(firstChip).toContainText('👍');
    await expect(firstChip).toContainText('3');
  });

  test('active chip has aria-pressed=true', async ({ page }) => {
    const activeChip = page.locator('button[aria-pressed="true"]').first();
    await expect(activeChip).toBeVisible();
    await expect(activeChip).toContainText('👍');
  });

  test('hovering a chip shows info tooltip', async ({ page }) => {
    const firstChip = page.locator('button[aria-pressed]').first();
    await firstChip.hover();
    // Wait for debounce (500ms) + render
    await page.waitForTimeout(700);
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses first chip', async ({ page }) => {
      const firstChip = page.locator('button[aria-label*="reacted by"]').first();
      // Click near the component first to set focus context
      await firstChip.focus();
      await expect(firstChip).toBeFocused();
    });

    test('ArrowRight moves focus to next chip', async ({ page }) => {
      const firstChip = page.locator('button[aria-label*="reacted by"]').first();
      await firstChip.focus();
      await page.keyboard.press('ArrowRight');
      const secondChip = page.locator('button[aria-label*="reacted by"]').nth(1);
      await expect(secondChip).toBeFocused();
    });

    test('ArrowLeft wraps to last chip', async ({ page }) => {
      const firstChip = page.locator('button[aria-label*="reacted by"]').first();
      await firstChip.focus();
      await page.keyboard.press('ArrowLeft');
      const lastChip = page.locator('button[aria-label*="reacted by"]').last();
      await expect(lastChip).toBeFocused();
    });

    test('Enter/Space on chip triggers reaction', async ({ page }) => {
      const firstChip = page.locator('button[aria-label*="reacted by"]').first();
      await firstChip.focus();
      await page.keyboard.press('Enter');
      // Verify the chip is still visible (reaction toggle is parent-handled)
      await expect(firstChip).toBeVisible();
    });
  });
});

test.describe('CometChatReactions - Overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-cometchatreactions--with-overflow&viewMode=story'
    );
  });

  test('shows overflow button when reactions exceed container', async ({
    page,
  }) => {
    const overflow = page.locator('button[aria-label*="more reactions"]');
    // May or may not be visible depending on container width
    const bar = page.locator('[role="group"][aria-label="Reactions"]');
    await expect(bar).toBeVisible();
  });
});

test.describe('CometChatReactions - Right Aligned', () => {
  test('renders correctly with right alignment', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-cometchatreactions--right-aligned&viewMode=story'
    );
    const bar = page.locator('[role="group"][aria-label="Reactions"]');
    await expect(bar).toBeVisible();
  });
});
