import { Page } from '@playwright/test';

export const TEST_USERS = {
  primary: 'e2e-user-1',
  secondary: 'e2e-user-2',
  tertiary: 'e2e-user-3',
} as const;

/**
 * Log in to the sample app as the given user.
 *
 * Handles:
 * 1. Credentials page (if shown) → fills App ID, Auth Key, selects region, submits
 * 2. Login page → enters UID and clicks Login
 * 3. Waits for home screen (conversations visible)
 */
export async function loginToApp(page: Page, uid?: string): Promise<void> {
  const userUid = uid ?? process.env.E2E_USER_UID ?? TEST_USERS.primary;
  const appId = process.env.COMETCHAT_APP_ID!;
  const authKey = process.env.COMETCHAT_AUTH_KEY!;
  const region = process.env.COMETCHAT_REGION ?? 'us';

  await page.goto('/');

  // Wait for either credentials page, login page, or home to appear
  await page.waitForSelector(
    '.cometchat-credentials__form, .cometchat-login__container, .cometchat-conversations',
    { timeout: 30_000 }
  );

  // If already on home (session restored), we're done
  const isHome = await page.locator('.cometchat-conversations').isVisible().catch(() => false);
  if (isHome) return;

  // Handle credentials page
  const isCredentials = await page.locator('.cometchat-credentials__form').isVisible().catch(() => false);
  if (isCredentials) {
    // Select region
    const regionEl = page.locator(`.cometchat-credentials__region-text:has-text("${region.toUpperCase()}")`).first();
    const hasRegion = await regionEl.isVisible().catch(() => false);
    if (hasRegion) await regionEl.click();

    // Fill App ID
    await page.locator('#appId-input').fill(appId);
    // Fill Auth Key
    await page.locator('#authKey-input').fill(authKey);
    // Submit
    await page.locator('.cometchat-credentials__button').click();

    // Wait for login page
    await page.waitForSelector('.cometchat-login__container', { timeout: 30_000 });
  }

  // Login page — fill UID and submit
  await page.locator('#uid-input').fill(userUid);
  await page.locator('.cometchat-login__submit-button').click();

  // Wait for home screen (conversations visible)
  await page.waitForSelector('.cometchat-conversations', { timeout: 60_000 });
}
