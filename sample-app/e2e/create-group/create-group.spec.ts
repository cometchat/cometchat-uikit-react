import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — CometChatCreateGroup (React)
 *
 * Tests the create group dialog from the Groups tab.
 * Uses correct selectors from the sample app's CometChatCreateGroup component.
 */

test.describe('CometChatCreateGroup', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });

    // Navigate to Groups tab
    const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForSelector('.cometchat-groups', { timeout: 15_000 });
    await page.waitForTimeout(2000);
  });

  /** Helper: open create group dialog */
  async function openCreateGroupDialog() {
    const createBtn = page.locator('.cometchat-groups__header-create-group-button').first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await page.waitForTimeout(1000);

    const dialog = page.locator('.cometchat-create-group__backdrop').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    return dialog;
  }

  test('create group dialog opens from groups tab', async () => {
    const dialog = await openCreateGroupDialog();
    await expect(dialog.locator('.cometchat-create-group')).toBeVisible();
  });

  test('form renders with name input and group type options', async () => {
    const dialog = await openCreateGroupDialog();

    // Name input
    const nameInput = dialog.locator('.cometchat-create-group__input').first();
    await expect(nameInput).toBeVisible();

    // Type options (Public, Private, Password)
    const typeOptions = dialog.locator('.cometchat-create-group__type');
    const typeCount = await typeOptions.count();
    expect(typeCount).toBe(3);
  });

  test('selecting password type shows password field', async () => {
    const dialog = await openCreateGroupDialog();

    // Click the Password type option
    const passwordOption = dialog.locator('.cometchat-create-group__type').nth(2);
    await expect(passwordOption).toBeVisible();
    await passwordOption.click();
    await page.waitForTimeout(500);

    // Password input should appear
    const passwordInput = dialog.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 3_000 });
  });

  test('public group creation works', async () => {
    const dialog = await openCreateGroupDialog();

    // Fill group name
    const nameInput = dialog.locator('#cometchat-create-group-name, .cometchat-create-group__input').first();
    const groupName = `E2E_Test_${Date.now()}`;
    await nameInput.fill(groupName);

    // Public is selected by default, submit
    const submitBtn = dialog.locator('.cometchat-create-group__submit-button');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Dialog should close after successful creation
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('close button closes the dialog', async () => {
    const dialog = await openCreateGroupDialog();

    const closeBtn = dialog.locator('.cometchat-create-group__close-button');
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
    await closeBtn.click();
    await page.waitForTimeout(1000);

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('create group dialog has proper ARIA attributes', async () => {
    const backdrop = await openCreateGroupDialog();

    // Backdrop has role="dialog"
    const role = await backdrop.getAttribute('role');
    expect(role).toBe('dialog');

    // Has aria-labelledby
    const labelledBy = await backdrop.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
  });
});
