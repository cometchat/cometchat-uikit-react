import { test, expect } from '../helpers/test';
import { loginToApp } from '../helpers';
import { expectNoNewA11yViolations } from '../helpers/axe';
import { openStrategyChat } from '../helpers/navigation';
import { openThreadFor, bubbleWithText } from '../helpers/threads';
import { sendStrategyMessage, PRIMARY_UID } from '../helpers/pinSave';

/**
 * Accessibility: an axe scan of each main screen (WCAG 2.0/2.1 A + AA).
 * Fails on violations not already in accessibility/axe-baseline.json.
 */

test('main screens have no new accessibility violations', { tag: '@smoke' }, async ({ page }) => {
  test.setTimeout(180_000);
  const tab = (name: string) => page.locator(`.cometchat-tab-component__tab:has-text("${name}")`).first();

  await loginToApp(page);

  await test.step('conversation list', async () => {
    await expect(page.locator('.cometchat-conversations__item').first()).toBeVisible({ timeout: 30_000 });
    await expectNoNewA11yViolations(page, 'conversations');
  });

  await test.step('an open chat', async () => {
    await openStrategyChat(page);
    await expectNoNewA11yViolations(page, 'chat');
  });

  await test.step('a thread', async () => {
    const text = `A11y thread [${Date.now()}]`;
    await sendStrategyMessage({ as: PRIMARY_UID, text });
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
    await openThreadFor(page, bubbleWithText(page, text));
    await expectNoNewA11yViolations(page, 'thread');
    await page.locator('.cometchat-thread-header__close-button').first().click();
  });

  await test.step('group details', async () => {
    await page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first().click();
    await expect(page.locator('.side-component-wrapper').first()).toBeVisible({ timeout: 10_000 });
    await expectNoNewA11yViolations(page, 'group details');
  });

  await test.step('users list', async () => {
    await tab('Users').click();
    await expect(page.locator('.cometchat-users__item').first()).toBeVisible({ timeout: 30_000 });
    await expectNoNewA11yViolations(page, 'users');
  });

  await test.step('groups list', async () => {
    await tab('Groups').click();
    await expect(page.locator('.cometchat-groups__item').first()).toBeVisible({ timeout: 30_000 });
    await expectNoNewA11yViolations(page, 'groups');
  });

  await test.step('calls', async () => {
    await tab('Calls').click();
    await expect(page.locator('.cometchat-call-logs').first()).toBeVisible({ timeout: 30_000 });
    // Scan the settled list (rows, or the empty/error state), not the loading shimmer: the rows
    // are what carry the violations, so scanning mid-load made the result depend on timing.
    await expect(page.locator('.cometchat-call-logs__shimmer')).toHaveCount(0, { timeout: 30_000 });
    await expect(
      page
        .locator(
          '.cometchat-call-logs__list-item, .cometchat-call-logs__empty-state-view, .cometchat-call-logs__error-state-view'
        )
        .first()
    ).toBeVisible({ timeout: 30_000 });
    await expectNoNewA11yViolations(page, 'calls');
  });

  await test.step('global search', async () => {
    await tab('Chats').click();
    await page.locator('.cometchat-conversations__search-bar').first().click();
    const input = page.locator('.cometchat-search__input input').first();
    await input.fill('Team');
    await expect(page.locator('.cometchat-search__conversations-list-item').first()).toBeVisible({ timeout: 15_000 });
    await expectNoNewA11yViolations(page, 'search');
  });
});
