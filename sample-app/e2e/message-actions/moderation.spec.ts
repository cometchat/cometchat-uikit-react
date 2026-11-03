import { test, expect, Page } from '../helpers/test';
import { knownIssue, loginToApp } from '../helpers';
import { createThrowawayGroup, createThrowawayUser, ThrowawayGroup, ThrowawayUser } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { adminHeaders, restBase, sendMessageToGroup, userHeaders } from '../helpers/pinSave';
import { bubbleWithText, openActionSheet } from '../helpers/threads';

/**
 * Moderation (catalog E2, E6): the group owner deletes a member's message,
 * reports one with a reason, and the profanity filter blocks a message. A
 * throwaway member writes into a throwaway group, so no shared message is ever
 * deleted, reported or blocked.
 */

let group: ThrowawayGroup;
let member: ThrowawayUser;

test.beforeEach(async () => {
  member = await createThrowawayUser({ name: `E2E Poster ${Date.now()}` });
  group = await createThrowawayGroup({ name: `E2E Moderation ${Date.now()}`, members: [member.uid] });
});

test.afterEach(async () => {
  await group.dispose();
  await member.dispose();
});

async function openGroupWith(page: Page, text: string): Promise<number> {
  const id = await sendMessageToGroup({ guid: group.guid, as: member.uid, text });
  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name, { expectMessages: true });
  await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
  return id;
}

test("the group owner can delete a member's message", async ({ page }) => {
  const text = `Member message to remove [${Date.now()}]`;
  const id = await openGroupWith(page, text);

  await openActionSheet(page, bubbleWithText(page, text));
  const deleteOption = page.getByRole('menuitem', { name: 'Delete', exact: true });
  // v6 offered Delete to group owners, admins and moderators as well as the sender.
  await knownIssue('Delete is offered only to the sender, not to group owners and moderators', async () => {
    await expect(deleteOption).toBeVisible({ timeout: 5_000 });
  });
  await deleteOption.click();
  const dialog = page.locator('.cometchat-confirm-dialog').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.locator('.cometchat-confirm-dialog__actions-confirm button').click();

  await expect(bubbleWithText(page, text)).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.cometchat-messages-wrapper .cometchat-delete-bubble').last()).toBeVisible();

  const res = await fetch(`${restBase()}/messages/${String(id)}`, { headers: adminHeaders() });
  const deletedAt = ((await res.json()) as { data?: { deletedAt?: number } }).data?.deletedAt;
  expect(deletedAt, 'the server marks the message deleted').toBeTruthy();
});

test('reporting a message with a reason submits it', async ({ page }) => {
  const text = `Member message to report [${Date.now()}]`;
  await openGroupWith(page, text);

  await openActionSheet(page, bubbleWithText(page, text));
  await page.getByRole('menuitem', { name: 'Report' }).click();

  const dialog = page.locator('.cometchat-flag-message-dialog').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  const submit = dialog.locator('.cometchat-flag-message-dialog__actions-submit').getByRole('button');
  await expect(submit).toBeDisabled();

  // Reasons come from the app's moderation settings; "Spam" is a default.
  await dialog.getByRole('radio', { name: 'Spam' }).click();
  await dialog.locator('.cometchat-flag-message-dialog__remark-input').fill('E2E test report — please ignore.');
  await expect(submit).toBeEnabled();
  const flagged = page.waitForResponse(r => /\/messages\/\d+\/flagged$/.test(r.url()));
  await submit.click();

  // Reporting needs the Moderation feature on the app's plan.
  const res = await flagged;
  const body = res.ok() ? '' : await res.text();
  test.skip(body.includes('ERR_FEATURE_NOT_ACCESSIBLE'), 'Moderation is not available on this app\'s plan');
  await expect(dialog).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('.cometchat-toast__text')).toHaveText('Message Reported.', { timeout: 10_000 });
});

test('the profanity filter blocks a message: the sender is told and the member never receives it', async ({ page }) => {
  // A word on the default profanity list, base64-encoded so it isn't spelled out in source.
  const blockedWord = Buffer.from('ZnVjaw==', 'base64').toString();
  const text = `Moderation check ${blockedWord} [${Date.now()}]`;
  await openGroupWith(page, `Moderation start [${Date.now()}]`);

  const input = page.locator('.cometchat-messages-wrapper .cometchat-message-composer [contenteditable="true"]').first();
  await input.click();
  await input.pressSequentially(text);
  await input.press('Enter');

  const bubble = page
    .locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper--outgoing')
    .filter({ hasText: text })
    .last();
  // The filter needs the Moderation feature with profanity filtering on the app.
  const blocked = bubble.locator('.cometchat-moderation-view');
  const sent = bubble.locator('.cometchat-receipts-sent, .cometchat-receipts-delivered, .cometchat-receipts-read');
  await expect(blocked.or(sent).first()).toBeVisible({ timeout: 20_000 });
  test.skip((await blocked.count()) === 0, 'Profanity filtering is not enabled on this app');

  await expect(blocked).toContainText('Your message was blocked due to moderation policies');
  await expect(bubble.locator('.cometchat-receipts-error')).toBeVisible();

  const res = await fetch(`${restBase()}/groups/${group.guid}/messages?per_page=10`, { headers: userHeaders(member.uid) });
  const texts = (((await res.json()) as { data?: { data?: { text?: string } }[] }).data ?? []).map(m => m.data?.text);
  expect(texts, 'the member never receives the blocked text').not.toContain(text);
});
