import { test, expect, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { restBase, sendMessageToGroup, userHeaders } from '../helpers/pinSave';
import { expectSendAccepted } from '../helpers/send';

/**
 * Joining and leaving groups (catalog J3, J4).
 *
 * Bob owns throwaway groups that Alice is not in, so every test starts from
 * "not a member" and nothing touches the shared seed groups.
 */

const HEADER_TITLE = '.cometchat-messages-wrapper .cometchat-message-header__title';

let group: ThrowawayGroup;

test.afterEach(async () => {
  await group.dispose();
});

async function aliceHasJoined(guid: string): Promise<boolean> {
  const res = await fetch(`${restBase()}/groups/${guid}`, { headers: userHeaders(PRIMARY_USER) });
  const data = ((await res.json()) as { data?: { hasJoined?: boolean } }).data;
  return Boolean(data?.hasJoined);
}

async function sendText(page: Page, text: string) {
  const input = page.locator('.cometchat-messages-wrapper .cometchat-message-composer [contenteditable="true"]').first();
  await expectSendAccepted(
    page,
    async () => {
      await input.click();
      await input.pressSequentially(text);
      await input.press('Enter');
    },
    { text }
  );
}

test('opening a public group joins it, and Alice can post', async ({ page }) => {
  group = await createThrowawayGroup({ name: `E2E Join public ${Date.now()}`, owner: SECONDARY_USER, members: [] });
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: `Welcome [${Date.now()}]` });
  expect(await aliceHasJoined(group.guid)).toBe(false);

  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name);

  await expect.poll(() => aliceHasJoined(group.guid), { timeout: 15_000 }).toBe(true);
  await sendText(page, `Alice joined and says hi [${Date.now()}]`);
});

test.describe('password-protected group', () => {
  const PASSWORD = 'e2e-secret-123';

  test.beforeEach(async ({ page }) => {
    group = await createThrowawayGroup({
      name: `E2E Join password ${Date.now()}`,
      owner: SECONDARY_USER,
      members: [],
      type: 'password',
      password: PASSWORD,
    });
    await loginToApp(page);
    await selectGroupByName(page, group.name);
  });

  test('a wrong password is rejected and the dialog stays open', async ({ page }) => {
    const dialog = page.locator('.cometchat-join-group').first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.locator('.cometchat-join-group__input input, input[type="password"]').first().fill('not-the-password');
    await dialog.locator('.cometchat-join-group__submit-button').first().click();

    await expect(dialog.locator('.cometchat-join-group__error')).toHaveText('Invalid password. Please try again.', {
      timeout: 10_000,
    });
    await expect(dialog).toBeVisible();
    expect(await aliceHasJoined(group.guid)).toBe(false);
  });

  test('the right password joins and opens the chat', async ({ page }) => {
    const dialog = page.locator('.cometchat-join-group').first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.locator('.cometchat-join-group__input input, input[type="password"]').first().fill(PASSWORD);
    await dialog.locator('.cometchat-join-group__submit-button').first().click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page.locator(HEADER_TITLE).first()).toContainText(group.name, { timeout: 15_000 });
    await expect.poll(() => aliceHasJoined(group.guid), { timeout: 15_000 }).toBe(true);
  });
});

test('leaving a group closes the chat and ends the membership', async ({ page }) => {
  group = await createThrowawayGroup({
    name: `E2E Leave ${Date.now()}`,
    owner: SECONDARY_USER,
    members: [PRIMARY_USER],
  });
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: `Before leaving [${Date.now()}]` });

  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name);

  await page.locator(HEADER_TITLE).first().click();
  const panel = page.locator('.side-component-wrapper').first();
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await panel.locator('.side-component-content__action-item:has-text("Leave")').first().click();

  const confirm = page.locator('.cometchat-confirm-dialog').filter({ hasText: 'Leave this group?' }).first();
  await expect(confirm).toBeVisible({ timeout: 5_000 });
  await confirm.getByRole('button', { name: 'Leave', exact: true }).click();

  await expect(confirm).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(HEADER_TITLE).filter({ hasText: group.name })).toHaveCount(0, { timeout: 10_000 });
  await expect.poll(() => aliceHasJoined(group.guid), { timeout: 15_000 }).toBe(false);
});
