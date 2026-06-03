import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatsearchbar';

test.describe('CometChatSearchBar', () => {
  // ─── Default story ─────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the search bar', async ({ page }) => {
      const root = page.locator('[class*="cometchat-search-bar"]').first();
      await expect(root).toBeVisible();
    });

    test('root container has role="search" landmark', async ({ page }) => {
      const search = page.getByRole('search');
      await expect(search).toBeVisible();
    });

    test('renders the search icon', async ({ page }) => {
      const icon = page.locator('[class*="cometchat-search-bar__icon"]');
      await expect(icon).toBeVisible();
    });

    test('renders the input with role="searchbox"', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await expect(input).toBeVisible();
    });

    test('renders the clear button', async ({ page }) => {
      const clearBtn = page.locator('button[aria-label="Clear search"]');
      await expect(clearBtn).toBeAttached();
    });

    test('typing updates the displayed value', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.fill('hello');
      await expect(input).toHaveValue('hello');
    });

    test('clear button becomes visible when input has value', async ({ page }) => {
      const input = page.getByRole('searchbox');
      const clearBtn = page.locator('button[aria-label="Clear search"]');

      // Initially hidden (empty input).
      await expect(clearBtn).toHaveCSS('visibility', 'hidden');

      await input.fill('test');
      await expect(clearBtn).not.toHaveCSS('visibility', 'hidden');
    });

    test('clicking clear button resets the input', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.fill('something');
      await expect(input).toHaveValue('something');

      const clearBtn = page.getByRole('button', { name: 'Clear search' });
      await clearBtn.click();
      await expect(input).toHaveValue('');
    });

    test('Escape key clears the input', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.fill('query');
      await expect(input).toHaveValue('query');

      await input.press('Escape');
      await expect(input).toHaveValue('');
    });
  });

  // ─── Disabled story ────────────────────────────────────────────────

  test.describe('Disabled story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--disabled&viewMode=story`);
    });

    test('input is disabled', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await expect(input).toBeDisabled();
    });

    test('clear button is disabled', async ({ page }) => {
      const clearBtn = page.getByRole('button', { name: 'Clear search' });
      await expect(clearBtn).toBeDisabled();
    });

    test('root has disabled modifier class', async ({ page }) => {
      const root = page.locator('[class*="cometchat-search-bar--disabled"]');
      await expect(root).toBeVisible();
    });
  });

  // ─── Uncontrolled story ────────────────────────────────────────────

  test.describe('Uncontrolled story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--uncontrolled&viewMode=story`);
    });

    test('renders with default value', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await expect(input).toHaveValue('initial query');
    });

    test('typing updates the value', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.clear();
      await input.fill('new value');
      await expect(input).toHaveValue('new value');
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

    test('search bar is visible in dark theme', async ({ page }) => {
      const root = page.locator('[class*="cometchat-search-bar"]').first();
      await expect(root).toBeVisible();
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

    test('search bar is visible in RTL', async ({ page }) => {
      const root = page.locator('[class*="cometchat-search-bar"]').first();
      await expect(root).toBeVisible();
    });

    test('input has RTL placeholder', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await expect(input).toHaveAttribute('placeholder', 'بحث...');
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('Tab moves focus to the input', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.focus();
      await expect(input).toBeFocused();
    });

    test('Tab from input moves focus to clear button when visible', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.focus();
      await input.fill('text');

      await page.keyboard.press('Tab');
      const clearBtn = page.getByRole('button', { name: 'Clear search' });
      await expect(clearBtn).toBeFocused();
    });

    test('Shift+Tab from clear button returns focus to input', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.focus();
      await input.fill('text');

      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(input).toBeFocused();
    });

    test('Escape clears the input value', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.focus();
      await input.fill('hello');
      await page.keyboard.press('Escape');
      await expect(input).toHaveValue('');
    });

    test('input does not show a focus outline when focused', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.focus();
      const outline = await input.evaluate(
        (el) => window.getComputedStyle(el).outlineStyle
      );
      expect(outline).toBe('none');
    });

    test('focus ring is visible on clear button when focused', async ({ page }) => {
      const input = page.getByRole('searchbox');
      await input.focus();
      await input.fill('text');

      await page.keyboard.press('Tab');
      const clearBtn = page.getByRole('button', { name: 'Clear search' });
      const outline = await clearBtn.evaluate(
        (el) => window.getComputedStyle(el).outlineStyle
      );
      expect(outline).not.toBe('none');
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  test.describe('Accessibility', () => {
    test('root has role="search" landmark', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const search = page.getByRole('search');
      await expect(search).toBeVisible();
    });

    test('input has role="searchbox"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const input = page.getByRole('searchbox');
      await expect(input).toBeVisible();
    });

    test('input has aria-label', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const input = page.getByRole('searchbox');
      const ariaLabel = await input.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('clear button has aria-label', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const clearBtn = page.locator('button[aria-label="Clear search"]');
      await expect(clearBtn).toHaveAttribute('aria-label', 'Clear search');
    });

    test('search icon is decorative (aria-hidden)', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const icon = page.locator('[class*="cometchat-search-bar__icon"]');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    test('disabled input has disabled attribute', async ({ page }) => {
      await page.goto(`${STORY_BASE}--disabled&viewMode=story`);
      const input = page.getByRole('searchbox');
      await expect(input).toBeDisabled();
    });
  });
});
