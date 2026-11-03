import { test, expect, Locator } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { addReaction, sendMessageToGroup } from '../helpers/pinSave';

/**
 * E2E — the full list of who reacted (catalog E1).
 *
 * In a throwaway group, Alice's message gets more different reactions than its bar can show,
 * so the bar ends in a "+N" button that opens the list. The list has an "All" tab and one tab
 * per emoji with its count, names who reacted, calls Alice "You", and lets her remove only her
 * own reaction.
 */

const CHARLIE = 'e2e-user-3';
const DIANA = 'e2e-user-4';
const REACTIONS: Record<string, string[]> = {
  [PRIMARY_USER]: ['👍'],
  [SECONDARY_USER]: ['👍', '❤️', '😂'],
  [CHARLIE]: ['👍', '😮', '😢'],
  [DIANA]: ['🙏', '🔥', '🎉', '👏', '💯'],
};
const TOTAL = Object.values(REACTIONS).flat().length;

let group: ThrowawayGroup;
let text: string;

test.beforeEach(async () => {
  group = await createThrowawayGroup({
    name: `E2E Reaction list ${Date.now()}`,
    owner: PRIMARY_USER,
    members: [SECONDARY_USER, CHARLIE, DIANA],
  });
  text = `Lots of reactions [${String(Date.now())}]`;
  const id = await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text });
  for (const [uid, emojis] of Object.entries(REACTIONS)) {
    for (const emoji of emojis) await addReaction(id, emoji, uid);
  }
});

test.afterEach(async () => {
  await group.dispose();
});

const tab = (list: Locator, emoji: string) => list.getByRole('tab').filter({ hasText: emoji });

test('the "+N" button opens who reacted, by emoji, and Alice can remove only her own', async ({ page }) => {
  await loginToApp(page);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name, { expectMessages: true });

  const bubble = page.locator('.cometchat-messages-wrapper .cometchat-message-bubble').filter({ hasText: text }).last();
  const overflow = bubble.locator('.cometchat-reactions__overflow');
  await expect(overflow).toBeVisible({ timeout: 15_000 });
  await overflow.click();

  const list = page.locator('.cometchat-reaction-list').first();
  await expect(list).toBeVisible({ timeout: 10_000 });

  await test.step('"All" counts every reaction and lists each one', async () => {
    await expect(tab(list, 'All')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(list, 'All')).toContainText(String(TOTAL));
    await expect(list.getByRole('listitem')).toHaveCount(TOTAL, { timeout: 10_000 });
  });

  await test.step('an emoji tab lists only who reacted with it, with Alice as "You"', async () => {
    await tab(list, '👍').click();
    await expect(tab(list, '👍')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(list, '👍')).toContainText('3');
    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(3, { timeout: 10_000 });
    await expect(items.filter({ hasText: 'You' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Bob Smith' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Charlie Brown' })).toHaveCount(1);
  });

  await test.step("only Alice's own row can be clicked, and it removes her reaction", async () => {
    const items = list.getByRole('listitem');
    await expect(items.filter({ hasText: 'Bob Smith' })).toHaveAttribute('tabindex', '-1');
    await items.filter({ hasText: 'You' }).click();
    await expect(bubble.locator('.cometchat-reactions__chip').filter({ hasText: '👍' })).toContainText('2', {
      timeout: 10_000,
    });
  });
});
