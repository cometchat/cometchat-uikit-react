import { test, expect, Page } from '@playwright/test';
import { loginToApp, openBobChat } from '../helpers';

/**
 * E2E Tests — User Details Panel (React)
 *
 * Tests the user details panel accessible from the message header.
 * The sample app renders user details with side-component-* classes.
 */

test.describe('User Details', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);
  });

  test('clicking header title opens user details', async () => {
    const headerTitle = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerTitle.click();
    await page.waitForTimeout(2000);

    const detailsPanel = page.locator('.side-component-wrapper').first();
    await expect(detailsPanel).toBeVisible({ timeout: 5_000 });
  });

  test('user details shows user name and avatar', async () => {
    const headerTitle = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerTitle.click();
    await page.waitForTimeout(2000);

    const detailsPanel = page.locator('.side-component-wrapper').first();
    await expect(detailsPanel).toBeVisible({ timeout: 5_000 });

    const avatar = page.locator('.side-component-content__avatar').first();
    await expect(avatar).toBeVisible({ timeout: 5_000 });

    const title = page.locator('.side-component-content__title').first();
    await expect(title).toBeVisible({ timeout: 5_000 });
    const titleText = await title.textContent();
    expect(titleText?.trim()).toBeTruthy();
  });

  test('user details has close button', async () => {
    const headerTitle = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerTitle.click();
    await page.waitForTimeout(2000);

    const detailsPanel = page.locator('.side-component-wrapper').first();
    await expect(detailsPanel).toBeVisible({ timeout: 5_000 });

    const closeBtn = page.locator('.side-component-header__icon').first();
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
    await closeBtn.click();
    await page.waitForTimeout(1000);

    await expect(detailsPanel).not.toBeVisible({ timeout: 5_000 });
  });

  test('user details header text is displayed', async () => {
    const headerTitle = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerTitle.click();
    await page.waitForTimeout(2000);

    const detailsPanel = page.locator('.side-component-wrapper').first();
    await expect(detailsPanel).toBeVisible({ timeout: 5_000 });

    const headerText = page.locator('.side-component-header__text').first();
    await expect(headerText).toBeVisible({ timeout: 5_000 });
    const text = await headerText.textContent();
    expect(text?.trim()).toBeTruthy();
  });

  test('user details has block user option', async () => {
    const headerTitle = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerTitle.click();
    await page.waitForTimeout(2000);

    const detailsPanel = page.locator('.side-component-wrapper').first();
    await expect(detailsPanel).toBeVisible({ timeout: 5_000 });

    const actionItems = page.locator('.side-component-content__action-item');
    const count = await actionItems.count();
    expect(count).toBeGreaterThan(0);

    // Find the block user action item
    const blockItem = page.locator('.side-component-content__action-item:has-text("Block")').first();
    await expect(blockItem).toBeVisible({ timeout: 5_000 });
  });
});
