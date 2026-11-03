import { test, expect, Page } from '../helpers/test';
import { knownIssue, loginToApp } from '../helpers';
import { adminHeaders, restBase } from '../helpers/pinSave';

/**
 * Creating private and password groups, and what happens with an empty name
 * (catalog J2). Groups are named E2E_Test_* and deleted after each test.
 */

const created: string[] = [];

test.beforeEach(async ({ page }) => {
  await loginToApp(page);
  await page.locator('.cometchat-tab-component__tab:has-text("Groups")').first().click();
});

test.afterEach(async () => {
  for (const name of created.splice(0)) {
    const guid = (await findGroup(name))?.guid;
    if (guid) await fetch(`${restBase()}/groups/${guid}`, { method: 'DELETE', headers: adminHeaders() });
  }
});

async function findGroup(name: string): Promise<{ guid: string; type: string } | undefined> {
  const res = await fetch(`${restBase()}/groups?searchKey=${encodeURIComponent(name)}&perPage=10`, {
    headers: adminHeaders(),
  });
  const rows = ((await res.json()) as { data?: { guid: string; name: string; type: string }[] }).data ?? [];
  return rows.find(r => r.name === name);
}

async function openDialog(page: Page) {
  await page.locator('.cometchat-groups__header-create-group-button').first().click();
  const dialog = page.locator('.cometchat-create-group').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  return dialog;
}

for (const [label, type] of [
  ['Private', 'private'],
  ['Password', 'password'],
] as const) {
  test(`a ${type} group is created with that type`, async ({ page }) => {
    const name = `E2E_Test_${label}_${Date.now()}`;
    created.push(name);
    const dialog = await openDialog(page);

    await dialog.getByRole('radiogroup', { name: 'Group type' }).getByText(label, { exact: true }).click();
    await expect(dialog.locator('.cometchat-create-group__type--selected')).toHaveText(label);
    await dialog.locator('#cometchat-create-group-name').fill(name);
    if (type === 'password') {
      await expect(dialog.locator('#cometchat-create-group-password')).toBeVisible();
      await dialog.locator('#cometchat-create-group-password').fill('e2e-secret-123');
    }
    await dialog.locator('.cometchat-create-group__submit-button').click();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect.poll(async () => (await findGroup(name))?.type, { timeout: 15_000 }).toBe(type);
  });
}

test('creating with an empty name is refused with a visible message', async ({ page }) => {
  const dialog = await openDialog(page);
  await dialog.locator('#cometchat-create-group-name').fill('');
  await dialog.locator('.cometchat-create-group__submit-button').click();

  // The dialog stays open and tells the user what to fix.
  await expect(dialog).toBeVisible();
  await knownIssue('an empty group name fails silently, with no message in the dialog', async () => {
    await expect(
      dialog.locator('[role="alert"], .cometchat-create-group__error, [aria-invalid="true"]').first(),
      'no feedback for an empty group name'
    ).toBeVisible({ timeout: 5_000 });
  });
});
