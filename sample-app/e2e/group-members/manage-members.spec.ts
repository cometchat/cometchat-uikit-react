import { test, expect, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER } from '../helpers';
import { createThrowawayGroup, createThrowawayUser, ThrowawayGroup, ThrowawayUser } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { adminHeaders, restBase, sendMessageToGroup } from '../helpers/pinSave';

/**
 * Managing group members as the owner (catalog J5): kick, ban and unban,
 * change scope. Alice owns a throwaway group whose members are throwaway users,
 * and every action is checked both in the UI and on the server.
 */

const HEADER_TITLE = '.cometchat-messages-wrapper .cometchat-message-header__title';

let group: ThrowawayGroup;
let member: ThrowawayUser;

test.beforeEach(async ({ page }) => {
  member = await createThrowawayUser({ name: `E2E Member ${Date.now()}` });
  group = await createThrowawayGroup({ name: `E2E Manage ${Date.now()}`, members: [member.uid] });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Manage start [${Date.now()}]` });

  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name);
  await page.locator(HEADER_TITLE).first().click();
  await expect(page.locator('.side-component-wrapper').first()).toBeVisible({ timeout: 10_000 });
});

test.afterEach(async () => {
  await group.dispose();
  await member.dispose();
});

function memberRow(page: Page) {
  return page.locator('.cometchat-group-members__item').filter({ hasText: member.name }).first();
}

async function openMemberMenu(page: Page) {
  const row = memberRow(page);
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await row.hover();
    await row.locator('.cometchat-group-members__item-menu [aria-haspopup="true"]').first().click({ timeout: 2_000 });
    await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

async function serverMember(guid: string, uid: string): Promise<{ scope?: string } | undefined> {
  const res = await fetch(`${restBase()}/groups/${guid}/members?perPage=100`, { headers: adminHeaders() });
  const rows = ((await res.json()) as { data?: { uid?: string; scope?: string }[] }).data ?? [];
  return rows.find(r => r.uid === uid);
}

async function serverBanned(guid: string, uid: string): Promise<boolean> {
  const res = await fetch(`${restBase()}/groups/${guid}/bannedusers?perPage=100`, { headers: adminHeaders() });
  const rows = ((await res.json()) as { data?: { uid?: string }[] }).data ?? [];
  return rows.some(r => r.uid === uid);
}

test('kicking a member removes them from the group', async ({ page }) => {
  await openMemberMenu(page);
  await page.getByRole('menuitem', { name: 'Kick' }).click();

  await expect(memberRow(page)).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(async () => (await serverMember(group.guid, member.uid)) === undefined, { timeout: 15_000 }).toBe(true);
});

test('banning moves a member to Banned Members, and unbanning releases them', async ({ page }) => {
  await openMemberMenu(page);
  await page.getByRole('menuitem', { name: 'Ban' }).click();

  await expect(memberRow(page)).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(() => serverBanned(group.guid, member.uid), { timeout: 15_000 }).toBe(true);

  await page.locator('.side-component-group-tabs__tab').filter({ hasText: 'Banned Members' }).click();
  const banned = page.locator('.cometchat-banned-members__item').filter({ hasText: member.name });
  await expect(banned).toBeVisible({ timeout: 15_000 });

  await banned.locator('.cometchat-banned-members__item-unban').click();
  await expect(banned).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(() => serverBanned(group.guid, member.uid), { timeout: 15_000 }).toBe(false);
});

test('changing a member to moderator is applied', async ({ page }) => {
  await openMemberMenu(page);
  await page.getByRole('menuitem', { name: 'Change Scope' }).click();

  const dialog = page.locator('.cometchat-change-scope').first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.locator('.cometchat-change-scope__list-item').filter({ hasText: /moderator/i }).click();
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  await expect(memberRow(page)).toContainText(/moderator/i, { timeout: 10_000 });
  await expect.poll(async () => (await serverMember(group.guid, member.uid))?.scope, { timeout: 15_000 }).toBe('moderator');
});
