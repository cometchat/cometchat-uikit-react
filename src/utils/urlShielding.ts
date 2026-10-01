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
 *
 * The span also stops before a `](` sequence, which is never part of an address
 * but is the separator of a markdown link. Pasting a copied link is the case
 * that needs it: the paste carries an anchor whose visible text is its own
 * address, so the composer stores `[https://host/p](https://host/p)`. Without
 * the guard the label's URL runs straight through `](` and the second address
 * as one unbroken span of non-space characters, the whole link collapses into a
 * single opaque placeholder, and the link rule never sees a `[…](…)` to
 * convert — the bubble shows the raw markdown instead of a clickable link.
 * Only `]` immediately followed by `(` ends the span, so an IPv6 host such as
 * `http://[::1]:3000/p` is still shielded whole.
 */
export const URL_PATTERN = /(?:https?:\/\/|www\.)(?:(?!\]\()[^\s<>])+/gi;

/**
 * Trailing characters that belong to the surrounding text rather than the URL —
 * the `.` ending `See https://example.com.`, or the `**` in
 * `**https://example.com**`. Leaving them outside the shielded span is what
 * lets markers that *wrap* a URL still apply.
 *
 * `)` is not here. It is the one character that is genuinely ambiguous, and
 * `trimUrlTrailing` decides it by balance rather than by position.
 */
export const URL_TRAILING_CHARS = /[\]}.,;:!?'"*_~`+]+$/;

/**
 * Trim the punctuation a URL picked up from the sentence around it.
 *
 * A closing paren is the hard case, because it ends both an address and the
 * markdown that wraps one. Stripping it unconditionally broke every Wikipedia
 * article whose title carries a qualifier — `/wiki/Mercury_(planet)` linked to
 * `/wiki/Mercury_(planet`, which does not exist — and keeping it
 * unconditionally would swallow the `)` that closes `[label](url)`.
 *
 * Neither position nor the character decides it; the balance does. A trailing
 * `)` that closes a `(` from inside the address belongs to the address, and one
 * with nothing to close belongs to the text. This is what CommonMark, GitHub
 * and Slack do, and it resolves both cases without a special rule for either:
 *
 *     https://en.wikipedia.org/wiki/Mercury_(planet)   →  kept, one for one
 *     [label](https://example.com/page)                →  dropped, nothing to close
 *
 * Trimming runs in a loop, so a URL ending `(planet).` loses the full stop and
 * then keeps its balanced paren.
 */
export function trimUrlTrailing(url: string, punctuation = URL_TRAILING_CHARS): string {
  let result = url;
  for (;;) {
    const withoutPunctuation = result.replace(punctuation, '');
    if (withoutPunctuation !== result) {
      result = withoutPunctuation;
      continue;
    }
    if (result.endsWith(')') && hasUnmatchedClose(result)) {
      result = result.slice(0, -1);
      continue;
    }
    return result;
  }
}

/** True when the string closes more parens than it opens. */
function hasUnmatchedClose(text: string): boolean {
  let depth = 0;
  for (const char of text) {
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
  }
  return depth < 0;
}

/**
 * Hand back the `)` that closes a markdown link, when balance alone would have
 * kept it inside the address.
 *
 * `trimUrlTrailing` weighs a trailing `)` against the `(` inside the address,
 * which is right for a bare address and for `[Mercury](…/Mercury_(planet))`,
 * where the link brings a second `)` of its own. It is wrong when the address
 * holds an unmatched `(` — for `[docs](https://example.com/a_(b)` the parens
 * balance only by borrowing the one paren the link has, leaving nothing to
 * close `[docs](`, so the link rule never matched and the bubble showed the
 * markdown verbatim.
 *
 * Position settles what balance cannot: inside a `[label](…)` target, a
 * trailing `)` with no second `)` after it is the link's, however the parens
 * within the address count up.
 */
function releaseLinkParen(text: string, offset: number, cleaned: string): string {
  if (!cleaned.endsWith(')')) return cleaned;
  // `startsWith` treats a negative position as 0, so a match at the very start
  // of the text cannot read before it.
  const isLinkTarget = offset >= 2 && text.startsWith('](', offset - 2);
  if (!isLinkTarget) return cleaned;
  return text[offset + cleaned.length] === ')' ? cleaned : cleaned.slice(0, -1);
}

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

  const shielded = text.replace(URL_PATTERN, (match, offset: number) => {
    const cleaned = releaseLinkParen(text, offset, trimUrlTrailing(match));
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
    const cleaned = trimUrlTrailing(match[0]);
    if (!cleaned) continue;
    const from = match.index;
    const to = from + cleaned.length;
    const opening = start >= from && start < to;
    const closing = end - 1 >= from && end - 1 < to;
    if (opening || closing) return true;
  }
  return false;
}
