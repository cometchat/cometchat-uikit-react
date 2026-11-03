import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, TEST_USERS } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { composerInput, conversationRow, HEADER_TITLE, openGroupChat } from './journey-helpers';

/**
 * Journey 3 — log out and log in as someone else in the same tab.
 *
 * Alice works in a group only she is in (Charlie is not a member), leaves a
 * draft and a panel open, then logs out; Charlie logs in through the app's own
 * login screen — no page reload, so anything kept in memory would show. None of
 * Alice's conversations, messages, draft or panels may be visible to Charlie.
 */

const CHARLIE = TEST_USERS.tertiary;

let alicesGroup: ThrowawayGroup;

test.beforeEach(async () => {
  alicesGroup = await createThrowawayGroup({ name: `E2E Alice only ${Date.now()}`, members: [] });
});

test.afterEach(async () => {
  await alicesGroup.dispose();
});

test("nothing from the previous user survives a logout and a different login", async ({ page }) => {
  test.setTimeout(180_000);
  const secret = `Alice's private note [${Date.now()}]`;
  const draft = `Alice's unsent draft [${Date.now()}]`;
  await sendMessageToGroup({ guid: alicesGroup.guid, as: PRIMARY_USER, text: secret });

  await test.step('Alice opens her group, leaves a draft and opens its details', async () => {
    await loginToApp(page);
    await openGroupChat(page, alicesGroup.name);
    await expect(page.getByText(secret)).toBeVisible({ timeout: 15_000 });
    await composerInput(page).click();
    await composerInput(page).pressSequentially(draft);
    await page.locator(HEADER_TITLE).first().click();
    await expect(page.locator('.side-component-wrapper').first()).toBeVisible({ timeout: 10_000 });
  });

  await test.step('Alice logs out from the conversations menu', async () => {
    await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
    await page.locator('.cometchat-conversations__header-menu button').first().click();
    await page.locator('.cometchat-conversations__header-menu-item--logout').first().click();
    await expect(page.locator('.cometchat-login__container')).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Charlie logs in on the same tab, without a reload', async () => {
    await page.locator('#uid-input').fill(CHARLIE);
    await page.locator('.cometchat-login__submit-button').click();
    await expect(page.locator('.cometchat-conversations__item').first()).toBeVisible({ timeout: 30_000 });
  });

  await test.step("none of Alice's session is visible to Charlie", async () => {
    await expect(conversationRow(page, alicesGroup.name)).toHaveCount(0);
    await expect(page.getByText(secret)).toHaveCount(0);
    await expect(page.getByText(draft)).toHaveCount(0);
    await expect(page.locator('.side-component-wrapper')).toHaveCount(0);
    await expect(page.locator(HEADER_TITLE).filter({ hasText: alicesGroup.name })).toHaveCount(0);
  });
});
