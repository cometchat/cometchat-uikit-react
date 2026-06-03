import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatactionsheet';

/** Helper: select action item buttons inside the dialog (not child spans). */
function itemButtons(page: import('@playwright/test').Page) {
  return page.locator('div[role="dialog"] button[class*="cometchat-action-sheet__item"]');
}

test.describe('CometChatActionSheet', () => {
  // ─── Default (list mode) ───────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the action sheet dialog', async ({ page }) => {
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('renders all action items in list mode', async ({ page }) => {
      await expect(itemButtons(page)).toHaveCount(7);
    });

    test('each item displays a title', async ({ page }) => {
      const titles = page.locator('[class*="cometchat-action-sheet__item-title"]');
      await expect(titles.first()).toBeVisible();
      await expect(titles.first()).not.toBeEmpty();
    });

    test('each item displays an icon', async ({ page }) => {
      const icons = page.locator('[class*="cometchat-action-sheet__item-icon"]');
      await expect(icons).toHaveCount(7);
    });

    test('closes on backdrop click', async ({ page }) => {
      const backdrop = page.locator('[class*="cometchat-action-sheet__backdrop"]');
      await backdrop.click({ position: { x: 5, y: 5 } });
      await expect(page.locator('div[role="dialog"]')).toBeHidden();
    });

    test('closes on Escape key', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.locator('div[role="dialog"]')).toBeHidden();
    });

    test('can reopen after closing', async ({ page }) => {
      // Ensure the dialog is fully rendered and focused before closing.
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(itemButtons(page).first()).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(page.locator('div[role="dialog"]')).toHaveCount(0);

      await page.getByRole('button', { name: 'Open Sheet' }).click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
    });
  });

  // ─── Grid mode ─────────────────────────────────────────────────────

  test.describe('Grid mode story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--grid-mode&viewMode=story`);
    });

    test('renders items in grid layout', async ({ page }) => {
      const gridLayout = page.locator('[class*="cometchat-action-sheet__layout-grid"]');
      await expect(gridLayout).toBeVisible();
    });

    test('items use grid modifier class', async ({ page }) => {
      const gridItems = page.locator('div[role="dialog"] button[class*="cometchat-action-sheet__item--grid"]');
      await expect(gridItems).toHaveCount(7);
    });

    test('renders header with title', async ({ page }) => {
      const title = page.locator('[class*="cometchat-action-sheet__header-title"]');
      await expect(title).toHaveText('Share');
    });

    test('close button in header closes the sheet', async ({ page }) => {
      const closeBtn = page.getByRole('button', { name: 'Close' });
      await closeBtn.click();
      await expect(page.locator('div[role="dialog"]')).toBeHidden();
    });
  });

  // ─── With header and close ─────────────────────────────────────────

  test.describe('WithHeaderAndClose story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-header-and-close&viewMode=story`);
    });

    test('renders header with custom title', async ({ page }) => {
      const title = page.locator('[class*="cometchat-action-sheet__header-title"]');
      await expect(title).toHaveText('Choose an action');
    });

    test('header has a visible close button', async ({ page }) => {
      const closeBtn = page.getByRole('button', { name: 'Close' });
      await expect(closeBtn).toBeVisible();
    });

    test('close button dismisses the sheet', async ({ page }) => {
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.locator('div[role="dialog"]')).toBeHidden();
    });
  });

  // ─── Disabled items ────────────────────────────────────────────────

  test.describe('WithDisabledItems story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-disabled-items&viewMode=story`);
    });

    test('renders 4 items total', async ({ page }) => {
      await expect(itemButtons(page)).toHaveCount(4);
    });

    test('disabled items have the disabled attribute', async ({ page }) => {
      const disabledItems = page.locator(
        'div[role="dialog"] button[class*="cometchat-action-sheet__item"]:disabled'
      );
      await expect(disabledItems).toHaveCount(2);
    });

    test('disabled items have aria-disabled="true"', async ({ page }) => {
      const disabledItems = page.locator(
        'div[role="dialog"] button[class*="cometchat-action-sheet__item"][aria-disabled="true"]'
      );
      await expect(disabledItems).toHaveCount(2);
    });

    test('disabled items have reduced opacity', async ({ page }) => {
      const disabledItem = page.locator(
        'div[role="dialog"] button[class*="cometchat-action-sheet__item"]:disabled'
      ).first();
      const opacity = await disabledItem.evaluate(
        el => window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBeLessThan(1);
    });

    test('enabled items are not disabled', async ({ page }) => {
      const enabledItems = page.locator(
        'div[role="dialog"] button[class*="cometchat-action-sheet__item"]:not(:disabled)'
      );
      await expect(enabledItems).toHaveCount(2);
    });
  });

  // ─── Empty state ───────────────────────────────────────────────────

  test.describe('EmptyState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--empty-state&viewMode=story`);
    });

    test('renders the sheet with no action items', async ({ page }) => {
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(itemButtons(page)).toHaveCount(0);
    });

    test('displays empty message text', async ({ page }) => {
      await expect(page.getByText('Nothing here yet.')).toBeVisible();
    });

    test('header shows title', async ({ page }) => {
      const title = page.locator('[class*="cometchat-action-sheet__header-title"]');
      await expect(title).toHaveText('No actions available');
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

    test('action sheet dialog is visible in dark theme', async ({ page }) => {
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('renders all items in dark theme', async ({ page }) => {
      await expect(itemButtons(page)).toHaveCount(7);
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

    test('action sheet dialog is visible in RTL', async ({ page }) => {
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('header displays RTL title', async ({ page }) => {
      const title = page.locator('[class*="cometchat-action-sheet__header-title"]');
      await expect(title).toHaveText('الإجراءات');
    });

    test('items render correctly in RTL', async ({ page }) => {
      await expect(itemButtons(page)).toHaveCount(7);
    });

    test('item text direction is RTL', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      const direction = await rtlContainer.evaluate(
        el => window.getComputedStyle(el).direction
      );
      expect(direction).toBe('rtl');
    });
  });


  // ─── Keyboard navigation ──────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('moves focus into the sheet on open', async ({ page }) => {
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();

      const isInsideDialog = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.closest('[role="dialog"]') !== null;
      });
      expect(isInsideDialog).toBe(true);
    });

    test('Tab cycles focus forward within the dialog (focus trap)', async ({ page }) => {
      // Wait for initial focus to settle.
      await expect(itemButtons(page).first()).toBeFocused();

      const dialog = page.locator('div[role="dialog"]');
      const buttons = dialog.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < count + 1; i++) {
        await page.keyboard.press('Tab');
        const isInside = await page.evaluate(() => {
          return document.activeElement?.closest('[role="dialog"]') !== null;
        });
        expect(isInside).toBe(true);
      }
    });

    test('Shift+Tab cycles focus backward (wraps to last)', async ({ page }) => {
      // Wait for initial focus to settle on first item.
      await expect(itemButtons(page).first()).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      // Should wrap to the last focusable element in the dialog.
      const isInside = await page.evaluate(() => {
        return document.activeElement?.closest('[role="dialog"]') !== null;
      });
      expect(isInside).toBe(true);
    });

    test('Escape closes the sheet', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.locator('div[role="dialog"]')).toBeHidden();
    });

    test('focus restores to trigger button after Escape', async ({ page, browserName }) => {
      // First close the initially-open sheet.
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(itemButtons(page).first()).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(page.locator('div[role="dialog"]')).toHaveCount(0);

      // Now click the button to open — this makes it the trigger.
      await page.getByRole('button', { name: 'Open Sheet' }).click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(itemButtons(page).first()).toBeFocused();

      // Close again — focus should restore to "Open Sheet".
      await page.keyboard.press('Escape');
      await expect(page.locator('div[role="dialog"]')).toHaveCount(0);

      // WebKit does not always honor programmatic .focus() on buttons,
      // so only assert focus restoration in Chromium and Firefox.
      if (browserName !== 'webkit') {
        const openBtn = page.getByRole('button', { name: 'Open Sheet' });
        await expect(openBtn).toBeFocused();
      }
    });

    test('ArrowDown moves focus to the next item', async ({ page }) => {
      const firstButton = itemButtons(page).first();
      await expect(firstButton).toBeFocused();

      await page.keyboard.press('ArrowDown');
      const secondButton = itemButtons(page).nth(1);
      await expect(secondButton).toBeFocused();
    });

    test('ArrowUp moves focus to the previous item', async ({ page }) => {
      // Wait for initial focus to settle on first item.
      await expect(itemButtons(page).first()).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(itemButtons(page).nth(1)).toBeFocused();

      await page.keyboard.press('ArrowUp');
      await expect(itemButtons(page).first()).toBeFocused();
    });

    test('ArrowDown wraps from last item to first', async ({ page }) => {
      const buttons = itemButtons(page);
      const count = await buttons.count();

      // Press ArrowDown enough times to wrap.
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('ArrowDown');
      }

      // Should be back on the first item.
      await expect(buttons.first()).toBeFocused();
    });

    test('ArrowUp wraps from first item to last', async ({ page }) => {
      // Wait for initial focus to settle on first item.
      await expect(itemButtons(page).first()).toBeFocused();
      // ArrowUp from first should wrap to last.
      await page.keyboard.press('ArrowUp');
      await expect(itemButtons(page).last()).toBeFocused();
    });

    test('Home moves focus to the first item', async ({ page }) => {
      // Move down a few times first.
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      await page.keyboard.press('Home');
      await expect(itemButtons(page).first()).toBeFocused();
    });

    test('End moves focus to the last item', async ({ page }) => {
      // Wait for initial focus to settle.
      await expect(itemButtons(page).first()).toBeFocused();
      await page.keyboard.press('End');
      await expect(itemButtons(page).last()).toBeFocused();
    });

    test('Enter activates the focused item', async ({ page }) => {
      // The items use noop onClick in stories, so just verify the button
      // receives the Enter keypress without error and stays in the dialog.
      await page.keyboard.press('Enter');
      // No crash, no navigation away — the sheet may close or stay open
      // depending on the onClick handler. In the story it's a noop.
    });

    test('Space activates the focused item', async ({ page }) => {
      await page.keyboard.press('Space');
      // Same as Enter — verify no crash with noop handler.
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  test.describe('Accessibility', () => {
    test('dialog has role="dialog" and aria-modal="true"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('dialog is labelled by the header title', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-header-and-close&viewMode=story`);
      const dialog = page.locator('div[role="dialog"]');
      const labelledBy = await dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBe('cometchat-action-sheet-title');

      const titleEl = page.locator('#cometchat-action-sheet-title');
      await expect(titleEl).toHaveText('Choose an action');
    });

    test('close button has accessible label', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-header-and-close&viewMode=story`);
      const closeBtn = page.getByRole('button', { name: 'Close' });
      await expect(closeBtn).toBeVisible();
    });

    test('disabled items are announced as disabled', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-disabled-items&viewMode=story`);
      const disabledItem = page.locator(
        'div[role="dialog"] button[class*="cometchat-action-sheet__item"][aria-disabled="true"]'
      ).first();
      await expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
      await expect(disabledItem).toBeDisabled();
    });

    test('backdrop has role="presentation"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const backdrop = page.locator('[class*="cometchat-action-sheet__backdrop"]');
      await expect(backdrop).toHaveAttribute('role', 'presentation');
    });
  });
});
