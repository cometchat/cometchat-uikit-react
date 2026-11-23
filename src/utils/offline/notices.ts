/**
 * Localized text for offline notices, with an internal plural lookup: a key
 * `name` has `name_one` / `name_other` (and, where a language needs them,
 * `name_few` / `name_many`) variants, picked with `Intl.PluralRules` for the
 * current language and falling back to `name_other`. `{{count}}` is replaced
 * with the count.
 *
 * @internal
 */
import type { OfflineNotice } from './hub';

type Localize = (key: string) => string;

/** `key` for `count`, from `key_<plural category>` then `key_other`. */
export function getLocalizedPlural(
  localize: Localize,
  language: string,
  key: string,
  count: number
): string {
  let category: string;
  try {
    category = new Intl.PluralRules(language || 'en').select(count);
  } catch {
    category = count === 1 ? 'one' : 'other';
  }
  const pick = (candidate: string): string => {
    const text = localize(candidate);
    return text && text !== candidate ? text : '';
  };
  const text = pick(`${key}_${category}`) || pick(`${key}_other`) || `${key}_other`;
  return text.replace(/\{\{count\}\}/g, String(count));
}

export function offlineNoticeText(
  notice: OfflineNotice,
  localize: Localize,
  language: string
): string {
  switch (notice.kind) {
    case 'unsent_message_removed':
      return localize('message_list_unsent_message_removed');
    case 'queue_full':
      return localize('message_list_queue_full');
    case 'file_too_large_offline':
      return localize('message_list_file_too_large_offline');
    case 'messages_not_sent':
      return getLocalizedPlural(
        localize,
        language,
        'message_list_messages_not_sent',
        notice.count ?? 1
      );
    case 'unsent_messages_lost':
      return getLocalizedPlural(
        localize,
        language,
        'message_list_unsent_messages_lost',
        notice.count ?? 1
      );
    case 'unsent_messages_maybe_lost':
      return localize('message_list_unsent_messages_maybe_lost');
    case 'send_in_flight':
      return localize('message_list_send_in_flight');
    default:
      return '';
  }
}
