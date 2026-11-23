/**
 * Offline notice text: one localized string per notice kind, and the plural
 * lookup (`key_<category>`, then `key_other`, then the raw `key_other`) with
 * `{{count}}` filled in.
 */
import { describe, expect, it } from 'vitest';
import { getLocalizedPlural, offlineNoticeText } from '../notices';
import type { OfflineNotice, OfflineNoticeKind } from '../hub';

const STRINGS: Record<string, string> = {
  message_list_unsent_message_removed: 'Unsent message removed',
  message_list_queue_full: 'Queue full',
  message_list_file_too_large_offline: 'File too large',
  message_list_unsent_messages_maybe_lost: 'Some unsent messages may be lost',
  message_list_messages_not_sent_one: '{{count}} message not sent',
  message_list_messages_not_sent_other: '{{count}} messages not sent',
  message_list_unsent_messages_lost_other: '{{count}} unsent messages lost',
  // A language with a few-form.
  sample_few: '{{count}} (few)',
  sample_other: '{{count}} (other)',
};
/** Like the kit's localize: the key itself when there is no string. */
const localize = (key: string) => STRINGS[key] ?? key;

const notice = (kind: OfflineNoticeKind, count?: number): OfflineNotice => ({
  id: 1,
  gen: 0,
  kind,
  count,
});

describe('getLocalizedPlural', () => {
  it('picks the category the language selects and fills {{count}} everywhere', () => {
    expect(getLocalizedPlural(localize, 'en', 'message_list_messages_not_sent', 1)).toBe(
      '1 message not sent'
    );
    expect(getLocalizedPlural(localize, 'en', 'message_list_messages_not_sent', 4)).toBe(
      '4 messages not sent'
    );
    expect(getLocalizedPlural(k => (k === 'x_other' ? '{{count}}/{{count}}' : k), 'en', 'x', 2)).toBe(
      '2/2'
    );
  });

  it("uses the language's own category (Polish 'few') when the key has it", () => {
    expect(getLocalizedPlural(localize, 'pl', 'sample', 3)).toBe('3 (few)');
    // 'many' is missing for this key: falls back to _other.
    expect(getLocalizedPlural(localize, 'pl', 'sample', 5)).toBe('5 (other)');
  });

  it('no category string: _other; no _other either: the raw key, still with no count to fill', () => {
    expect(getLocalizedPlural(localize, 'en', 'message_list_unsent_messages_lost', 1)).toBe(
      '1 unsent messages lost'
    );
    expect(getLocalizedPlural(localize, 'en', 'nothing_here', 2)).toBe('nothing_here_other');
    // A localize that answers empty strings counts as missing too.
    expect(getLocalizedPlural(() => '', 'en', 'empty', 2)).toBe('empty_other');
  });

  it('an empty language is English; an invalid language tag falls back to one/other', () => {
    expect(getLocalizedPlural(localize, '', 'message_list_messages_not_sent', 1)).toBe(
      '1 message not sent'
    );
    expect(getLocalizedPlural(localize, 'not a tag!', 'message_list_messages_not_sent', 1)).toBe(
      '1 message not sent'
    );
    expect(getLocalizedPlural(localize, 'not a tag!', 'message_list_messages_not_sent', 3)).toBe(
      '3 messages not sent'
    );
  });
});

describe('offlineNoticeText', () => {
  it.each([
    ['unsent_message_removed', 'Unsent message removed'],
    ['queue_full', 'Queue full'],
    ['file_too_large_offline', 'File too large'],
    ['unsent_messages_maybe_lost', 'Some unsent messages may be lost'],
  ] as const)('%s reads its string', (kind, text) => {
    expect(offlineNoticeText(notice(kind), localize, 'en')).toBe(text);
  });

  it('messages_not_sent and unsent_messages_lost are counted; no count means one', () => {
    expect(offlineNoticeText(notice('messages_not_sent', 3), localize, 'en')).toBe(
      '3 messages not sent'
    );
    expect(offlineNoticeText(notice('messages_not_sent'), localize, 'en')).toBe(
      '1 message not sent'
    );
    expect(offlineNoticeText(notice('unsent_messages_lost', 2), localize, 'en')).toBe(
      '2 unsent messages lost'
    );
    expect(offlineNoticeText(notice('unsent_messages_lost'), localize, 'en')).toBe(
      '1 unsent messages lost'
    );
  });

  it('an unknown kind has no text', () => {
    expect(offlineNoticeText(notice('future_kind' as OfflineNoticeKind), localize, 'en')).toBe('');
  });
});
