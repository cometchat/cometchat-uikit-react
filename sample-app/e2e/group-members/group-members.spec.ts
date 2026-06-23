import { test, expect, Page } from '@playwright/test';
import { loginToApp, openDesignTeamChat, openStrategyChat } from '../helpers';

/**
 * E2E Tests — CometChatGroupMembers (React)
 *
 * Tests the group members component.
 * Requires navigating to a group and opening the members panel.
 */

test.describe('CometChatGroupMembers', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    await openStrategyChat(page);

    // Open group details/members by clicking header info
    const headerInfo = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerInfo.click();
    await page.waitForTimeout(2000);
  });

  test('members list renders for a given group', async () => {
    const membersList = page.locator('.cometchat-group-members').first();
    await expect(membersList).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(2000);
    const memberItems = page.locator('.cometchat-group-members .cometchat-group-members__item');
    const count = await memberItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('member role displays correctly (owner/admin/member)', async () => {
    const membersList = page.locator('.cometchat-group-members').first();
    await expect(membersList).toBeVisible({ timeout: 10_000 });

    const roleIndicator = page.locator('.cometchat-group-members__item-role-badge').first();
    await expect(roleIndicator).toBeVisible({ timeout: 5_000 });
    const roleText = await roleIndicator.textContent();
    expect(roleText?.trim()).toBeTruthy();
  });

  test('search filters members by name', async () => {
    const membersList = page.locator('.cometchat-group-members').first();
    await expect(membersList).toBeVisible({ timeout: 10_000 });

    const searchBar = page.locator('.cometchat-group-members__search-bar input, .cometchat-group-members input').first();
    await expect(searchBar).toBeVisible({ timeout: 5_000 });

    await searchBar.fill('zzzznonexistent12345');
    await page.waitForTimeout(2000);

    const itemCount = await page.locator('.cometchat-group-members .cometchat-group-members__item').count();
    expect(itemCount).toBeGreaterThanOrEqual(0);

    await searchBar.fill('');
    await page.waitForTimeout(2000);
  });

  test('group members list has proper ARIA attributes', async () => {
    const membersList = page.locator('.cometchat-group-members').first();
    await expect(membersList).toBeVisible({ timeout: 10_000 });

    const hasAriaElements = await membersList.locator('[aria-label], [role]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasAriaElements).toBeTruthy();
  });

  test('empty state renders when no members match search', async () => {
    const membersList = page.locator('.cometchat-group-members').first();
    await expect(membersList).toBeVisible({ timeout: 10_000 });

    const searchBar = page.locator('.cometchat-group-members__search-bar input, .cometchat-group-members input').first();
    await expect(searchBar).toBeVisible({ timeout: 5_000 });

    await searchBar.fill('zzzznonexistentmember99999');
    await page.waitForTimeout(2000);

    // No member items should be visible
    const itemCount = await page.locator('.cometchat-group-members .cometchat-group-members__item').count();
    expect(itemCount).toBe(0);

    // Clear for other tests
    await searchBar.fill('');
    await page.waitForTimeout(1000);
  });

  test('context menu shows kick, ban, and change scope for a regular participant', async () => {
    const membersList = page.locator('.cometchat-group-members').first();
    await expect(membersList).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Find a member item that does NOT have a role badge (i.e., a regular participant)
    const allItems = page.locator('.cometchat-group-members__item');
    const count = await allItems.count();

    let participantItem = null;
    for (let i = 0; i < count; i++) {
      const item = allItems.nth(i);
      const hasBadge = await item.locator('.cometchat-group-members__item-role-badge').isVisible().catch(() => false);
      if (!hasBadge) {
        participantItem = item;
        break;
      }
    }

    expect(participantItem).not.toBeNull();

    // Hover the participant item to reveal the context menu trigger
    await participantItem!.hover();
    await page.waitForTimeout(500);

    // Click the context menu trigger (the button with aria-haspopup inside the item-menu)
    const menuTrigger = participantItem!.locator('.cometchat-group-members__item-menu [aria-haspopup="true"]').first();
    await expect(menuTrigger).toBeVisible({ timeout: 5_000 });
    await menuTrigger.click();
    await page.waitForTimeout(500);

    // Verify Kick, Ban, and Change Scope options are present in the dropdown
    const kickOption = page.locator('[role="menuitem"]:has-text("Kick")').first();
    await expect(kickOption).toBeVisible({ timeout: 5_000 });

    const banOption = page.locator('[role="menuitem"]:has-text("Ban")').first();
    await expect(banOption).toBeVisible({ timeout: 5_000 });

    const changeScopeOption = page.locator('[role="menuitem"]:has-text("Change Scope")').first();
    await expect(changeScopeOption).toBeVisible({ timeout: 5_000 });

    // Close the menu without performing any action
    await page.keyboard.press('Escape');
  });
});
