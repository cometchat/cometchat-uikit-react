import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '../helpers/test';
import { knownIssue, loginToApp } from '../helpers';

/**
 * E2E — the UI follows the browser's language (catalog R3).
 *
 * The UI should follow the browser's language. Each case starts a browser in another language and
 * checks that the app's own chrome (tabs, list titles, the composer and its screen-reader label)
 * and the page language follow it. Expected texts are read from the translation files, so a
 * reworded translation doesn't break the test. Today the provider defaults to English; following
 * the browser is planned, so this is marked as a known issue until then.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const kit = (lang: string) =>
  JSON.parse(
    readFileSync(path.resolve(HERE, `../../../src/resources/CometChatLocalize/resources/${lang}/translation.json`), 'utf8')
  ) as Record<string, string>;
const app = (lang: string) =>
  JSON.parse(readFileSync(path.resolve(HERE, `../../src/locales/${lang}.json`), 'utf8')) as Record<string, string>;

for (const { browserLocale, lang } of [
  { browserLocale: 'de-DE', lang: 'de' },
  { browserLocale: 'ja-JP', lang: 'ja' },
  { browserLocale: 'zh-TW', lang: 'zh-tw' },
]) {
  test.describe(`browser language ${browserLocale}`, () => {
    test.use({ locale: browserLocale });

    test(`the app is in ${lang}`, async ({ page }) => {
      const t = kit(lang);
      const a = app(lang);
      await loginToApp(page);

      await test.step('page language and navigation', async () => {
        await knownIssue('CometChatProvider uses English by default; following the browser language is planned', async () => {
          await expect(page.locator('html')).toHaveAttribute('lang', lang);
        });
        const tabs = page.locator('.cometchat-tab-component__tab');
        for (const key of ['chats', 'calls', 'users', 'groups']) {
          await expect(tabs.filter({ hasText: a[key] ?? key }).first()).toBeVisible({ timeout: 15_000 });
        }
      });

      await test.step('chat list', async () => {
        await expect(page.locator('.cometchat-conversations').first()).toContainText(
          t.conversation_chat_title ?? 'conversation_chat_title'
        );
      });

      await test.step('composer', async () => {
        // Strategy is pinned to the top of the chat list (an admin pin the seed keeps).
        await page.locator('.cometchat-conversations__item').filter({ hasText: 'Strategy' }).first().click();
        const input = page.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
        await expect(input).toBeVisible({ timeout: 15_000 });
        await expect(input).toHaveAttribute('aria-label', t.message_composer_type_message ?? '');
        await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-composer').first()).toContainText(
          t.message_composer_placeholder ?? 'message_composer_placeholder'
        );
      });
    });
  });
}
