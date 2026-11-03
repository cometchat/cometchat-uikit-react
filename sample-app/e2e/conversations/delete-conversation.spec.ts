import { test, expect, Locator, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';

/**
 * E2E — deleting a conversation from the conversation list (catalog B4).
 *
 * Destructive, so every test deletes a conversation it created itself: a
 * throwaway group with one message, removed again afterwards.
 */

let group: ThrowawayGroup;

test.beforeEach(async ({ page }) => {
  group = await createThrowawayGroup({ name: `E2E Delete conv ${Date.now()}` });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `To be deleted [${Date.now()}]` });
  await loginToApp(page);
});

test.afterEach(async () => {
  await group.dispose();
});

function rowFor(page: Page, name: string): Locator {
  return page.locator('.cometchat-conversations__item').filter({ hasText: name });
}

/**
 * Open the row's Delete action. With conversation pinning on, the row offers a
 * Pin/Delete menu; without it, a lone delete icon — handle both.
 */
async function chooseDelete(page: Page, row: Locator) {
  await row.hover();
  const options = row.locator('.cometchat-conversations__item-options');
  await expect(options).toBeVisible({ timeout: 5_000 });

  const lone = options.locator('.cometchat-conversations__item-delete-button');
  if ((await lone.count()) > 0) {
    await lone.first().click();
    return;
  }
  await expect(async () => {
    await row.hover();
    await options.getByRole('button').first().click({ timeout: 2_000 });
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
}

function deleteDialog(page: Page) {
  return page.locator('.cometchat-conversations__delete-dialog');
}

test('deleting a conversation removes it from the list, and it stays gone after a reload', async ({ page }) => {
  const row = rowFor(page, group.name);
  await expect(row).toBeVisible({ timeout: 30_000 });

  await chooseDelete(page, row);
  await expect(deleteDialog(page)).toBeVisible({ timeout: 5_000 });
  await deleteDialog(page).getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(deleteDialog(page)).toBeHidden({ timeout: 10_000 });
  await expect(row).toHaveCount(0, { timeout: 10_000 });

  await page.reload();
  await expect(page.locator('.cometchat-conversations__item').first()).toBeVisible({ timeout: 30_000 });
  await expect(rowFor(page, group.name)).toHaveCount(0);
});

test('cancelling the confirmation keeps the conversation', async ({ page }) => {
  const row = rowFor(page, group.name);
  await expect(row).toBeVisible({ timeout: 30_000 });

  await chooseDelete(page, row);
  await expect(deleteDialog(page)).toBeVisible({ timeout: 5_000 });
  await deleteDialog(page).getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect(deleteDialog(page)).toBeHidden({ timeout: 5_000 });
  await expect(row).toBeVisible();
});

test('a new message brings a deleted conversation back', async ({ page }) => {
  const row = rowFor(page, group.name);
  await expect(row).toBeVisible({ timeout: 30_000 });

  await chooseDelete(page, row);
  await deleteDialog(page).getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(row).toHaveCount(0, { timeout: 10_000 });

  const text = `Back again [${Date.now()}]`;
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText(text);
});
