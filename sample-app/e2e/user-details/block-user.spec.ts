import { test, expect, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER } from '../helpers';
import { createThrowawayUser, ThrowawayUser } from '../helpers/fixtures';
import { restBase, sendDirectMessage, userHeaders } from '../helpers/pinSave';

/**
 * Blocking a user (catalog G3, D12).
 *
 * Alice blocks a throwaway user (never a shared seed user): the composer is
 * replaced by the "blocked" banner and the server records the block; unblocking
 * from the banner brings the composer back.
 */

const HEADER_TITLE = '.cometchat-messages-wrapper .cometchat-message-header__title';
const COMPOSER = '.cometchat-messages-wrapper .cometchat-message-composer';
const BANNER = '.cometchat-messages__blocked-banner';

let contact: ThrowawayUser;

test.beforeEach(async () => {
  contact = await createThrowawayUser({ name: `E2E Blockable ${Date.now()}` });
  await sendDirectMessage({ from: contact.uid, to: PRIMARY_USER, text: `Hi Alice [${Date.now()}]` });
});

test.afterEach(async () => {
  await fetch(`${restBase()}/users/${PRIMARY_USER}/blockedusers`, {
    method: 'DELETE',
    headers: userHeaders(PRIMARY_USER),
    body: JSON.stringify({ blockedUids: [contact.uid] }),
  });
  await contact.dispose();
});

async function aliceBlocks(uid: string): Promise<boolean> {
  const res = await fetch(`${restBase()}/users/${PRIMARY_USER}/blockedusers?perPage=100`, {
    headers: userHeaders(PRIMARY_USER),
  });
  const rows = ((await res.json()) as { data?: { uid?: string }[] }).data ?? [];
  return rows.some(r => r.uid === uid);
}

async function openChatWithContact(page: Page) {
  await loginToApp(page);
  const row = page.locator('.cometchat-conversations__item').filter({ hasText: contact.name }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();
  await expect(page.locator(HEADER_TITLE).first()).toContainText(contact.name, { timeout: 15_000 });
  await expect(page.locator(COMPOSER).first()).toBeVisible();
}

test('blocking from user details replaces the composer; unblocking restores it', async ({ page }) => {
  await openChatWithContact(page);

  await test.step('block from the user details', async () => {
    await page.locator(HEADER_TITLE).first().click();
    const panel = page.locator('.side-component-wrapper').first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await panel.locator('.side-component-content__action-item:has-text("Block")').first().click();

    const confirm = page.locator('.cometchat-confirm-dialog').filter({ hasText: 'Block this contact?' }).first();
    await expect(confirm).toBeVisible({ timeout: 5_000 });
    await confirm.getByRole('button', { name: 'Block', exact: true }).click();
    await expect(confirm).toBeHidden({ timeout: 10_000 });
  });

  await test.step('the composer is replaced by the blocked banner, and the server has the block', async () => {
    await expect(page.locator(BANNER)).toContainText("Can't send a message to blocked user.", { timeout: 10_000 });
    await expect(page.locator(COMPOSER)).toHaveCount(0);
    await expect.poll(() => aliceBlocks(contact.uid), { timeout: 15_000 }).toBe(true);
    await expect(
      page.locator('.side-component-wrapper .side-component-content__action-item:has-text("Unblock")')
    ).toBeVisible();
  });

  await test.step('unblocking from the banner brings the composer back', async () => {
    await page.locator(`${BANNER} .cometchat-messages__blocked-banner-link`).click();
    await expect(page.locator(BANNER)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator(COMPOSER).first()).toBeVisible();
    await expect.poll(() => aliceBlocks(contact.uid), { timeout: 15_000 }).toBe(false);
  });
});

test('cancelling the block keeps the composer', async ({ page }) => {
  await openChatWithContact(page);
  await page.locator(HEADER_TITLE).first().click();
  await page.locator('.side-component-wrapper .side-component-content__action-item:has-text("Block")').first().click();

  const confirm = page.locator('.cometchat-confirm-dialog').filter({ hasText: 'Block this contact?' }).first();
  await expect(confirm).toBeVisible({ timeout: 5_000 });
  await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();

  await expect(confirm).toBeHidden({ timeout: 5_000 });
  await expect(page.locator(BANNER)).toHaveCount(0);
  await expect(page.locator(COMPOSER).first()).toBeVisible();
  expect(await aliceBlocks(contact.uid)).toBe(false);
});
