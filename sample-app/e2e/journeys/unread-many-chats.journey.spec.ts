import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { conversationRow, HEADER_TITLE, unreadBadge } from './journey-helpers';

/**
 * Journey 6 — messages arrive in several chats while another one is open.
 *
 * Each badge must count exactly its own chat's messages, the open chat must
 * not get a badge, and opening each chat must clear only that chat's badge.
 */

let groups: ThrowawayGroup[] = [];
let focus: ThrowawayGroup;

test.beforeEach(async () => {
  const tag = Date.now();
  focus = await createThrowawayGroup({ name: `E2E Unread focus ${tag}` });
  groups = [
    await createThrowawayGroup({ name: `E2E Unread A ${tag}` }),
    await createThrowawayGroup({ name: `E2E Unread B ${tag}` }),
    await createThrowawayGroup({ name: `E2E Unread C ${tag}` }),
  ];
  for (const g of [focus, ...groups]) {
    await sendMessageToGroup({ guid: g.guid, as: PRIMARY_USER, text: `Start [${tag}]` });
  }
});

test.afterEach(async () => {
  for (const g of [focus, ...groups]) await g.dispose();
});

test('unread counts stay per chat and clear one chat at a time', async ({ page }) => {
  test.setTimeout(240_000);
  const counts = [2, 1, 3];
  const tag = Date.now();

  await test.step('Alice is in a fourth chat while messages arrive elsewhere', async () => {
    // Open it from the Chats list, so the list stays on screen while messages arrive.
    await loginToApp(page);
    await expect(conversationRow(page, focus.name)).toBeVisible({ timeout: 30_000 });
    await conversationRow(page, focus.name).click();
    await expect(page.locator(HEADER_TITLE).first()).toContainText(focus.name, { timeout: 15_000 });
    for (const [i, g] of groups.entries()) {
      for (let n = 0; n < counts[i]; n++) {
        await sendMessageToGroup({ guid: g.guid, as: SECONDARY_USER, text: `Unread ${String(n)} [${tag}]` });
      }
    }
    await sendMessageToGroup({ guid: focus.guid, as: SECONDARY_USER, text: `In the open chat [${tag}]` });
  });

  await test.step('each chat shows its own count, and the open chat none', async () => {
    for (const [i, g] of groups.entries()) {
      await expect(unreadBadge(conversationRow(page, g.name))).toHaveText(String(counts[i]), { timeout: 20_000 });
    }
    await expect(unreadBadge(conversationRow(page, focus.name))).toHaveCount(0);
  });

  await test.step('opening each chat clears only its own badge', async () => {
    for (const [i, g] of groups.entries()) {
      await conversationRow(page, g.name).click();
      await expect(page.locator(HEADER_TITLE).first()).toContainText(g.name, { timeout: 15_000 });
      await expect(unreadBadge(conversationRow(page, g.name))).toHaveCount(0, { timeout: 15_000 });
      for (const [j, other] of groups.entries()) {
        if (j > i) await expect(unreadBadge(conversationRow(page, other.name))).toHaveText(String(counts[j]));
      }
    }
  });
});
