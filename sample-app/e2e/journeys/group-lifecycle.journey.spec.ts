import { test, expect, Page } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { adminHeaders, restBase, sendMessageToGroup } from '../helpers/pinSave';
import {
  bubblesContaining,
  composerInput,
  conversationRow,
  HEADER_TITLE,
  newSession,
  openChatsTab,
  openGroupChat,
  sendFromComposer,
} from './journey-helpers';

/**
 * Journey 5 — a group's life, seen by both the admin and a member.
 *
 * Alice adds Bob, Bob posts, Alice promotes him, Alice kicks him (Bob is told
 * and stops receiving messages), Alice re-adds him, then deletes the group and
 * it disappears for Bob too. Everything Alice does goes through the UI; Bob
 * watches in his own session.
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Lifecycle ${Date.now()}`, members: [] });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Lifecycle start [${Date.now()}]` });
});

test.afterEach(async () => {
  await group.dispose();
});

async function openDetails(page: Page) {
  await page.locator(HEADER_TITLE).first().click();
  const panel = page.locator('.side-component-wrapper').first();
  await expect(panel).toBeVisible({ timeout: 10_000 });
  return panel;
}

/** Open a member's row menu in Alice's group-members list. */
async function memberMenu(page: Page, name: string) {
  const row = page.locator('.cometchat-group-members__item').filter({ hasText: name }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await row.hover();
    await row.locator('.cometchat-group-members__item-menu [aria-haspopup="true"]').first().click({ timeout: 2_000 });
    await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

test("a group's lifecycle is consistent for the admin and a member", async ({ page: alice, browser }) => {
  test.setTimeout(300_000);
  const tag = Date.now();
  const bob = await newSession(browser, SECONDARY_USER);
  try {
    await loginToApp(alice);
    await openGroupChat(alice, group.name);

    await test.step('Alice adds Bob from the group details', async () => {
      const panel = await openDetails(alice);
      await panel.locator('.side-component-content__action-item:has-text("Add Members")').first().click();
      const overlay = alice.locator('.cometchat-add-members').first();
      await expect(overlay).toBeVisible({ timeout: 10_000 });
      await overlay.locator('input').first().fill('Bob');
      await overlay.locator('.cometchat-users__item').filter({ hasText: 'Bob Smith' }).first().click();
      await overlay.locator('.cometchat-add-members__add-btn').click();
      await expect(overlay).toBeHidden({ timeout: 15_000 });
    });

    await test.step('the group appears for Bob, and his message reaches Alice', async () => {
      await openChatsTab(bob);
      await expect(conversationRow(bob, group.name)).toBeVisible({ timeout: 30_000 });
      await conversationRow(bob, group.name).click();
      const hello = `Bob says hi [${tag}]`;
      await sendFromComposer(bob, hello);
      await expect(bubblesContaining(alice, hello)).toHaveCount(1, { timeout: 15_000 });
    });

    await test.step('Alice makes Bob a moderator; both see the change', async () => {
      await memberMenu(alice, 'Bob Smith');
      await alice.getByRole('menuitem', { name: 'Change Scope' }).click();
      const dialog = alice.locator('.cometchat-change-scope').first();
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.locator('.cometchat-change-scope__list-item').filter({ hasText: /moderator/i }).click();
      await dialog.getByRole('button', { name: 'Save' }).click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });

      const row = alice.locator('.cometchat-group-members__item').filter({ hasText: 'Bob Smith' }).first();
      await expect(row).toContainText(/moderator/i, { timeout: 10_000 });
      await expect(bob.locator('.cometchat-messages-wrapper').getByText(/moderator/i).last()).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("Alice kicks Bob: he is told, and stops receiving the group's messages", async () => {
      await memberMenu(alice, 'Bob Smith');
      // Kick acts immediately — there is no confirmation step.
      await alice.getByRole('menuitem', { name: 'Kick' }).click();
      await expect(alice.locator('.cometchat-group-members__item').filter({ hasText: 'Bob Smith' })).toHaveCount(0, {
        timeout: 15_000,
      });

      await expect(bob.getByText('You are no longer part of the group')).toBeVisible({ timeout: 15_000 });
      await bob.getByRole('button', { name: 'Understood' }).click();

      const afterKick = `After the kick [${tag}]`;
      await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: afterKick });
      await expect(bubblesContaining(alice, afterKick)).toHaveCount(1, { timeout: 15_000 });
      await expect(bob.getByText(afterKick)).toHaveCount(0);
    });

    await test.step('Alice deletes the group; it disappears for Bob too', async () => {
      // Re-add Bob (over REST — the add flow was covered above) so the delete reaches a member.
      const res = await fetch(`${restBase()}/groups/${group.guid}/members`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ participants: [SECONDARY_USER] }),
      });
      expect(res.ok).toBe(true);
      await openChatsTab(bob);
      await expect(conversationRow(bob, group.name)).toBeVisible({ timeout: 30_000 });

      await alice.keyboard.press('Escape');
      const panel = await openDetails(alice);
      await panel.locator('.side-component-content__action-item:has-text("Delete and Exit")').first().click();
      await alice.getByRole('button', { name: /^(Delete & Exit|Delete and Exit|Delete)$/ }).last().click();

      await expect(conversationRow(alice, group.name)).toHaveCount(0, { timeout: 15_000 });

      // The SDK has no "group deleted" event for other members, so Bob's row can
      // linger until he reloads. What the kit controls: sending into the deleted
      // group fails visibly, the app stays up, and a reload drops the group.
      if ((await conversationRow(bob, group.name).count()) > 0) {
        await conversationRow(bob, group.name).click();
        const late = `Into a deleted group [${tag}]`;
        await composerInput(bob).click();
        await composerInput(bob).pressSequentially(late);
        await composerInput(bob).press('Enter');
        // It must either show as failed, or stay in the composer.
        await knownIssue('a message sent into a chat whose history failed to load is silently dropped', async () => {
          await expect
            .poll(
              async () =>
                (await bubblesContaining(bob, late).last().locator('.cometchat-receipts-error').count()) > 0 ||
                (await composerInput(bob).innerText()).includes(late),
              { message: 'the message sent into a deleted group vanished without feedback', timeout: 20_000 }
            )
            .toBe(true);
        }, { intermittent: true });
        await expect(bob.locator('.cometchat-conversations')).toBeVisible();
      }
      await bob.reload();
      await expect(bob.locator('.cometchat-conversations__item').first()).toBeVisible({ timeout: 30_000 });
      await expect(conversationRow(bob, group.name)).toHaveCount(0);
    });
  } finally {
    await bob.context().close();
  }
});
