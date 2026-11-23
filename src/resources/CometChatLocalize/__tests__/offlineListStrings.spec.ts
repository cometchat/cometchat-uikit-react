import { describe, expect, it } from 'vitest';
import { translationResources } from '../translations';

/**
 * The text of the offline list states (D84): English in both English locales, and in every other
 * locale the text Android ships for the same state (its strings_offline_lists.xml,
 * strings_offline_search.xml and strings.xml), so the kits read the same.
 */
const ENGLISH: Record<string, string> = {
  conversations_connect_to_load: 'Connect to load chats',
  users_connect_to_load: 'Connect to load users',
  groups_connect_to_load: 'Connect to load groups',
  group_members_connect_to_load: 'Connect to load members',
  message_list_connect_to_load: 'Connect to load messages',
  reaction_list_connect_to_load: 'Connect to load reactions',
  notifications_connect_to_load: 'Connect to load notifications',
  search_connect_to_search: 'Connect to search',
  search_connect_to_search_messages: 'Connect to search',
  search_connect_to_search_subtitle: 'Search needs an internet connection.',
  // The message list's tappable edge rows (older and newer).
  message_list_connect_to_load_more: 'Connect to load more',
  message_list_connect_to_load_newer: 'Connect to load more',
};

/** Translated in every other locale (Android's text for each). */
const TRANSLATED = Object.keys(ENGLISH);

/** A few exact Android strings, to prove the text was copied rather than re-translated. */
const ANDROID: Record<string, Record<string, string>> = {
  de: {
    users_connect_to_load: 'Verbinden, um Benutzer zu laden',
    search_connect_to_search: 'Verbinden, um zu suchen',
    search_connect_to_search_messages: 'Zum Suchen verbinden',
    search_connect_to_search_subtitle: 'Die Suche benötigt eine Internetverbindung.',
    message_list_connect_to_load_more: 'Verbinden, um mehr zu laden',
    message_list_connect_to_load_newer: 'Verbinden, um mehr zu laden',
  },
  ja: {
    search_connect_to_search_subtitle: '検索にはインターネット接続が必要です。',
    message_list_connect_to_load: '接続するとメッセージを読み込めます',
  },
  'zh-tw': {
    search_connect_to_search: '連線以搜尋',
    search_connect_to_search_messages: '連線後即可搜尋',
    search_connect_to_search_subtitle: '搜尋需要網路連線。',
  },
};

describe('offline list strings', () => {
  const locales = Object.entries(translationResources);

  for (const [locale, resource] of locales) {
    const strings = resource.translation ?? {};
    if (locale.toLowerCase().startsWith('en')) {
      it(`${locale} has the D84 English text`, () => {
        for (const [key, text] of Object.entries(ENGLISH)) {
          expect(strings[key], `${locale}:${key}`).toBe(text);
        }
      });
    } else {
      it(`${locale} translates every list state`, () => {
        for (const key of TRANSLATED) {
          expect(strings[key], `${locale}:${key}`).toBeTruthy();
          expect(strings[key], `${locale}:${key}`).not.toBe(ENGLISH[key]);
        }
      });
    }
  }

  for (const [locale, expected] of Object.entries(ANDROID)) {
    it(`${locale} uses Android's text`, () => {
      const strings = translationResources[locale]?.translation ?? {};
      for (const [key, text] of Object.entries(expected)) {
        expect(strings[key], `${locale}:${key}`).toBe(text);
      }
    });
  }
});
