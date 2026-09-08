/**
 * Localization lookup with a real fallback.
 *
 * WHY THIS EXISTS: the localizer returns the KEY itself when a string is missing,
 * not `undefined`. So the obvious `t(key) ?? fallback` never fires — the fallback
 * is unreachable and a missing string renders as `accessibility_message_pinned`
 * on screen or, worse, inside an `aria-label`. The check has to be against the
 * key, which is easy to get wrong once per call site; this is that check, written
 * once.
 *
 * Two entry points because callers hold the lookup in two shapes: components have
 * `getLocalizedString` from `useLocale`, while non-React code reaches for the
 * shared `CometChatLocalize` instance.
 */
import { CometChatLocalize } from '../resources/CometChatLocalize/CometChatLocalize';

/** Resolve `key`, or return `fallback` when the string is missing. */
export function localizeWithFallback(
  translate: ((key: string) => string) | undefined,
  key: string,
  fallback: string
): string {
  const result = translate?.(key);
  return result && result !== key ? result : fallback;
}

/**
 * Same contract, reading the shared localizer.
 * For code with no access to `useLocale` — plugin option factories, list rows
 * built outside a provider.
 */
export function localizeSharedWithFallback(key: string, fallback: string): string {
  return localizeWithFallback(
    (k: string) => CometChatLocalize.getSharedInstance()?.t(k) ?? k,
    key,
    fallback
  );
}
