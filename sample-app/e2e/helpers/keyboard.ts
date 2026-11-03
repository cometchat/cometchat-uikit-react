import { Locator, expect } from '@playwright/test';

/**
 * Assert WCAG list keyboard navigation on `items`: ArrowDown/ArrowUp move DOM
 * focus one item, and Home/End jump to the first/last item.
 */
export async function expectArrowFocusNavigation(items: Locator): Promise<void> {
  await expect(items.nth(1)).toBeVisible({ timeout: 30_000 });
  await items.first().focus();
  await expect(items.first()).toBeFocused();

  await items.first().press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();

  await items.nth(1).press('ArrowUp');
  await expect(items.first()).toBeFocused();

  await items.first().press('End');
  await expect(items.last()).toBeFocused();

  await items.last().press('Home');
  await expect(items.first()).toBeFocused();
}
