import { describe, expect, it } from 'vitest';
import { translationResources } from '../translations';

/** Every string the offline UI uses, in every shipped locale (UIK-A11Y-01). */
const OFFLINE_KEYS = [
  'message_list_not_sent_yet',
  'message_list_not_sent_tap_to_retry',
  'message_list_not_sent',
  'message_list_unsent_message_removed',
  'message_list_messages_not_sent_one',
  'message_list_messages_not_sent_other',
  'message_list_unsent_messages_lost_one',
  'message_list_unsent_messages_lost_other',
  'message_list_unsent_messages_maybe_lost',
  'message_list_queue_full',
  'message_list_send_in_flight',
  'message_list_file_too_large_offline',
  'message_list_connect_to_load_more',
  'message_list_connect_to_load_newer',
  'message_list_jump_to_latest',
  'message_list_option_delete_failed',
  'message_bubble_media_available_when_online',
  // Reused keys the offline UI relies on.
  'retry',
  'close',
  'message_list_option_copy',
  'message_list_option_delete',
];

describe('offline strings', () => {
  for (const [locale, resource] of Object.entries(translationResources)) {
    it(`${locale} has every offline string, non-empty, with {{count}} in plural forms`, () => {
      const strings = resource.translation ?? {};
      for (const key of OFFLINE_KEYS) {
        expect(strings[key], `${locale}:${key}`).toBeTruthy();
        if (/_(one|other|few|many)$/.test(key)) {
          expect(strings[key], `${locale}:${key}`).toContain('{{count}}');
        }
      }
    });
  }
});
