/**
 * Shared URL shielding for the markdown passes.
 *
 * Markdown markers that appear inside a URL are address characters, not
 * formatting: a Google Drive share link carries one underscore in the file ID
 * and another in `?usp=drive_link`, and pairing them rewrites the middle of the
 * address. There are three independent markdown passes in the UI Kit — the
 * message renderer, the composer's as-you-type detector, and the composer's
 * paste/draft converter — so the rule lives here rather than in each of them.
 */

/**
 * Matches bare URLs (http://, https://, www.). `<` and `>` are excluded so an
 * adjacent HTML tag or mention token is never swallowed into the span.
 */
export const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>]+/gi;

/**
 * Trailing characters that belong to the surrounding text rather than the URL —
 * the `)` closing `[label](url)`, or the `**` in `**https://example.com**`.
 * Leaving them outside the shielded span is what lets markers that *wrap* a URL
 * still apply.
 */
export const URL_TRAILING_CHARS = /[)\]}.,;:!?'"*_~`+]+$/;

/** Text with its URLs replaced by placeholders, plus the inverse operation. */
export interface ShieldedText {
  /** The text with each URL swapped for an opaque placeholder. */
  text: string;
  /** Put the URLs back. Safe to call on any string, including a fragment. */
  restore: (value: string) => string;
}

const PLACEHOLDER = /\u200B\uFFFCURLTKN(\d+)\uFFFC\u200B/g;

/**
 * Replace bare URLs with placeholders so no markdown rule can rewrite their
 * contents, and hand back the means to restore them.
 *
 * The placeholder carries no markdown-significant characters, so every rule
 * simply passes over it.
 */
export function shieldUrls(text: string): ShieldedText {
  const urls: string[] = [];

  const shielded = text.replace(URL_PATTERN, match => {
    const cleaned = match.replace(URL_TRAILING_CHARS, '');
    if (!cleaned) return match;
    const index = urls.length;
    urls.push(cleaned);
    // Any trailing characters stay outside the placeholder so markers that wrap
    // the URL still pair up.
    return `\u200B\uFFFCURLTKN${String(index)}\uFFFC\u200B${match.slice(cleaned.length)}`;
  });

  const restore = (value: string): string =>
    urls.length === 0
      ? value
      : value.replace(PLACEHOLDER, (_match, index: string) => urls[parseInt(index, 10)] ?? '');

  return { text: shielded, restore };
}

/**
 * True when either end of the span [start, end) sits inside a URL.
 *
 * Used by the as-you-type detector, which works on caret offsets rather than by
 * rewriting the text. `end` is exclusive, so the closing marker is at `end - 1`.
 */
export function markersInsideUrl(text: string, start: number, end: number): boolean {
  for (const match of text.matchAll(URL_PATTERN)) {
    const cleaned = match[0].replace(URL_TRAILING_CHARS, '');
    if (!cleaned) continue;
    const from = match.index;
    const to = from + cleaned.length;
    const opening = start >= from && start < to;
    const closing = end - 1 >= from && end - 1 < to;
    if (opening || closing) return true;
  }
  return false;
}
