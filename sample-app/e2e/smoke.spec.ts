import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers';

/**
 * Smoke test — verifies the E2E setup works:
 * 1. Sample app loads
 * 2. Login flow completes
 * 3. Home page renders with conversations
 */
test.describe('Smoke Test', () => {
  test('should load the sample app and login successfully', async ({ page }) => {
    await loginToApp(page);
    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });

  test('conversations list shows at least one item', async ({ page }) => {
    await loginToApp(page);
    const items = page.locator('.cometchat-conversations__item');
    await expect(items.first()).toBeVisible({ timeout: 30_000 });
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });
});
