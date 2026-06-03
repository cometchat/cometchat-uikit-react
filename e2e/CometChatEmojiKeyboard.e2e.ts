import { test, expect } from '@playwright/test';

test.describe('CometChatEmojiKeyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatemojikeyboard--default&viewMode=story'
    );
    await page.waitForSelector('[class*="cometchat-emoji-keyboard"]');
  });

  test('renders the emoji keyboard with category tabs and emoji grid', async ({
    page,
  }) => {
    const keyboard = page.locator('[class*="cometchat-emoji-keyboard"]').first();
    await expect(keyboard).toBeVisible();

    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThan(0);

    const emojiItems = page.locator('[role="gridcell"]');
    await expect(emojiItems.first()).toBeVisible();
    expect(await emojiItems.count()).toBeGreaterThan(0);
  });

  test('clicking a category tab scrolls to that category', async ({
    page,
  }) => {
    const tabs = page.locator('[role="tab"]');
    const secondTab = tabs.nth(1);
    await secondTab.click();

    const secondTabLabel = await secondTab.getAttribute('aria-label');
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');
    expect(secondTabLabel).toBeTruthy();
  });

  test('typing in search filters emojis in real-time', async ({ page }) => {
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.fill('smile');
    await page.waitForTimeout(300);

    const emojiItems = page.locator('[role="gridcell"]');
    const count = await emojiItems.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(1800);
  });

  test('clicking an emoji triggers the onEmojiClick callback', async ({
    page,
  }) => {
    const firstEmoji = page.locator('[role="gridcell"]').first();
    await firstEmoji.click();

    const selectedText = page.locator('text=Selected:');
    await expect(selectedText).toBeVisible();
  });

  test('empty state shown when search yields no results', async ({
    page,
  }) => {
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.fill('zzzzzzzzzzzzzzz');
    await page.waitForTimeout(300);

    const emptyState = page.locator('[role="status"]');
    await expect(emptyState).toBeVisible();
  });

  test('clearing search restores full emoji list', async ({ page }) => {
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.fill('smile');
    await page.waitForTimeout(200);

    const filteredCount = await page.locator('[role="gridcell"]').count();

    await searchInput.fill('');
    await page.waitForTimeout(200);

    const fullCount = await page.locator('[role="gridcell"]').count();
    expect(fullCount).toBeGreaterThan(filteredCount);
  });
});

test.describe('CometChatEmojiKeyboard - Dark Theme', () => {
  test('renders correctly in dark theme', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatemojikeyboard--dark-theme&viewMode=story'
    );
    const keyboard = page.locator('[class*="cometchat-emoji-keyboard"]').first();
    await expect(keyboard).toBeVisible();
  });
});

test.describe('CometChatEmojiKeyboard - RTL', () => {
  test('renders correctly in RTL mode', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatemojikeyboard--rtl&viewMode=story'
    );
    const keyboard = page.locator('[class*="cometchat-emoji-keyboard"]').first();
    await expect(keyboard).toBeVisible();
  });
});

test.describe('CometChatEmojiKeyboard - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatemojikeyboard--default&viewMode=story'
    );
    await page.waitForSelector('[class*="cometchat-emoji-keyboard"]');
  });

  test('Tab key moves focus between sections', async ({ page }) => {
    await page.keyboard.press('Tab');
    const searchInput = page.locator('input[role="searchbox"]');
    await expect(searchInput).toBeFocused();

    await page.keyboard.press('Tab');
    // Should move to clear button or next focusable element
  });

  test('ArrowLeft/ArrowRight navigates between category tabs', async ({
    page,
  }) => {
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();
    await expect(firstTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowRight');
    const secondTab = page.locator('[role="tab"]').nth(1);
    await expect(secondTab).toBeFocused();
  });

  test('Enter activates the focused category tab', async ({ page }) => {
    const secondTab = page.locator('[role="tab"]').nth(1);
    await secondTab.focus();
    await page.keyboard.press('Enter');
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Arrow keys navigate the emoji grid', async ({ page }) => {
    const firstEmoji = page.locator('[role="gridcell"]').first();
    await firstEmoji.focus();
    await expect(firstEmoji).toBeFocused();

    await page.keyboard.press('ArrowRight');
    const secondEmoji = page.locator('[role="gridcell"]').nth(1);
    await expect(secondEmoji).toBeFocused();
  });

  test('Enter selects the focused emoji', async ({ page }) => {
    const firstEmoji = page.locator('[role="gridcell"]').first();
    await firstEmoji.focus();
    await page.keyboard.press('Enter');

    const selectedText = page.locator('text=Selected:');
    await expect(selectedText).toBeVisible();
  });

  test('Escape clears the search input', async ({ page }) => {
    const searchInput = page.locator('input[role="searchbox"]');
    await searchInput.fill('smile');
    await page.waitForTimeout(200);

    await page.keyboard.press('Escape');
    await expect(searchInput).toHaveValue('');
  });

  test('Home/End move to first/last tab when tabs are focused', async ({
    page,
  }) => {
    const tabs = page.locator('[role="tab"]');
    const firstTab = tabs.first();
    await firstTab.focus();

    await page.keyboard.press('End');
    const lastTab = tabs.last();
    await expect(lastTab).toBeFocused();

    await page.keyboard.press('Home');
    await expect(firstTab).toBeFocused();
  });

  test('focus is visually indicated on interactive elements', async ({
    page,
  }) => {
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();

    // Verify the tab has a visible focus indicator via :focus-visible
    const outlineStyle = await firstTab.evaluate((el) => {
      return window.getComputedStyle(el).outlineStyle;
    });
    expect(outlineStyle).not.toBe('none');
  });
});
