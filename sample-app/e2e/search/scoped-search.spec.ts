import { test, expect } from '../helpers/test';
import { loginToApp, openDesignTeamChat } from '../helpers';

/**
 * Searching inside one conversation (catalog G2). Searches Design Team's
 * seeded history — search indexing lags new messages, and searching changes
 * nothing, so the read-only fixture is safe here.
 */

const TERM = 'Figma';
const MESSAGE = 'Should we use Figma?';

test('in-chat search finds a message and jumps to it in the conversation', async ({ page }) => {
  await loginToApp(page);
  await openDesignTeamChat(page);

  const standalone = page.locator('.cometchat-message-header__menu-button--search').first();
  if ((await standalone.count()) > 0 && (await standalone.isVisible())) {
    await standalone.click();
  } else {
    await page
      .locator('.cometchat-message-header__menu-button')
      .filter({ has: page.locator('.cometchat-message-header__menu-button-icon--more') })
      .first()
      .click();
    await page.getByText('Search', { exact: true }).first().click();
  }

  const search = page.locator('.cometchat-search').first();
  await expect(search).toBeVisible({ timeout: 5_000 });
  await search.locator('.cometchat-search__input input').first().fill(TERM);

  // Results are scoped to this conversation.
  const results = search.locator('.cometchat-search__messages-list-item');
  const hit = results.filter({ hasText: MESSAGE }).first();
  await expect(hit).toBeVisible({ timeout: 20_000 });
  for (const text of await results.allInnerTexts()) expect(text).toContain(TERM);

  await hit.click();
  await expect(
    page.locator('.cometchat-messages-wrapper .cometchat-message-list__bubble-highlight').filter({ hasText: MESSAGE })
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper').filter({ hasText: MESSAGE }).first()
  ).toBeInViewport();
});
