import { test, expect, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';

/**
 * E2E — links in the composer (catalog D3): insert through the toolbar's link dialog, the
 * dialog's validation, and editing or removing a link through its popover. A throwaway group,
 * so the sent messages don't pile up in a shared chat.
 */

let group: ThrowawayGroup;

test.beforeEach(async ({ page }) => {
  group = await createThrowawayGroup({ name: `E2E Links ${Date.now()}`, owner: PRIMARY_USER, members: [SECONDARY_USER] });
  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name);
});

test.afterEach(async () => {
  await group.dispose();
});

const composer = (page: Page) => page.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
const linkButton = (page: Page) =>
  page.locator('.cometchat-messages-wrapper .cometchat-message-composer').getByRole('button', { name: 'Link', exact: true });
const linkDialog = (page: Page) => page.locator('.cometchat-link-dialog').first();

async function insertLink(page: Page, text: string, url: string) {
  await composer(page).click();
  await linkButton(page).click();
  const dialog = linkDialog(page);
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.locator('#link-text-input').fill(text);
  await dialog.locator('#link-url-input').fill(url);
  await dialog.locator('.cometchat-link-dialog__button-group-save').click();
  await expect(dialog).toBeHidden({ timeout: 5_000 });
}

test('a link inserted from the toolbar is sent as a link', async ({ page }) => {
  const text = `CometChat docs ${Date.now()}`;
  const url = 'https://www.cometchat.com/docs';
  await insertLink(page, text, url);

  await expect(composer(page).locator(`a[href="${url}"]`)).toHaveText(text);

  await composer(page).press('Enter');
  const sent = page
    .locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper--outgoing')
    .filter({ hasText: text })
    .last();
  await expect(sent.locator(`a[href="${url}"]`)).toHaveText(text, { timeout: 15_000 });
});

test('the link dialog refuses an empty URL with a visible message', async ({ page }) => {
  await composer(page).click();
  await linkButton(page).click();
  const dialog = linkDialog(page);
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.locator('#link-text-input').fill('No URL');
  await dialog.locator('.cometchat-link-dialog__button-group-save').click();

  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.cometchat-link-dialog__error')).toBeVisible();
  await expect(dialog.locator('#link-url-input')).toHaveAttribute('aria-invalid', 'true');
});

test("a link's popover offers edit and remove, and remove keeps the text", async ({ page }) => {
  const text = `Removable link ${Date.now()}`;
  await insertLink(page, text, 'https://www.cometchat.com/');

  await composer(page).locator('a').filter({ hasText: text }).click();
  const popover = page.locator('.cometchat-link-popover').first();
  await expect(popover).toBeVisible({ timeout: 5_000 });
  await expect(popover.locator('.cometchat-link-popover__url')).toContainText('cometchat.com');
  await expect(popover.locator('.cometchat-link-popover__button--edit')).toBeVisible();

  await popover.locator('.cometchat-link-popover__button--remove').click();
  await expect(popover).toBeHidden({ timeout: 5_000 });
  await expect(composer(page).locator('a')).toHaveCount(0);
  await expect(composer(page)).toContainText(text);
});
