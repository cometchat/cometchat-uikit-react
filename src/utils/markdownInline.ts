/**
 * The inline markdown marker set, defined once.
 *
 * The same text is formatted by several independent passes — the message
 * bubble, the composer as you type, the composer when text is pasted or a draft
 * or edit is restored, the conversation subtitle, the reply/thread quote, and
 * search results. Each of these used to carry its own copy of the marker
 * regexes, which drifted: some grew lookarounds and others did not, `++text++`
 * was understood in the bubble but not in the composer, and only some had URL
 * shielding. The result was a preview that disagreed with the sent message.
 *
 * Every pass now takes its rules from `INLINE_RULES`, so a marker cannot be
 * supported in one place and missing in another. Where a pass genuinely needs
 * to differ, that has to be declared here as a flag with a reason, rather than
 * emerging silently from separate copies.
 */

/** The formatting a marker pair produces, independent of which tag renders it. */
export type InlineFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';

export interface InlineRule {
  format: InlineFormat;
  /** Global pattern; capture group 1 is the content between the markers. */
  pattern: RegExp;
  /**
   * The same rule anchored to the end of the string, for the as-you-type pass,
   * which tests the text behind the caret after each keystroke. Not global:
   * it is used with `exec`, so a `lastIndex` would carry between calls.
   */
  anchored: RegExp;
  /**
   * Applied only by the composer. A lone `*` is a typing convenience — the
   * composer converts it and the message is sent as `**`, so the bubble never
   * needs the rule, and treating a single asterisk as bold there would wrongly
   * format ordinary text such as `2*3*4`.
   */
  editorOnly?: boolean;
}

/**
 * Only the underscore markers carry a word-boundary guard, which is what
 * CommonMark does and what the underscore bug actually needed: `_` and `__` may
 * not sit between two word characters, so `snake_case_name_here`, `my_var_name`
 * and `a_b` stay plain text, while `_word_.`, `(_word_)` and `_word_👋` still
 * italicise.
 *
 * The guard is `\p{L}`/`\p{N}` on a `u`-flagged pattern, not an ASCII list of
 * allowed neighbours. An allow-list looked equivalent for English and silently
 * dropped everything else: with it, `**重要**です`, `**Hello**👋`, `«**bold**»`
 * and `**bold**-suffix` all rendered their markers literally, and since
 * Japanese, Chinese and Korean are written without spaces, emphasis stopped
 * working for those locales almost entirely.
 *
 * The asterisk, tilde and plus markers carry no guard at all, again like
 * CommonMark, which allows intraword emphasis for `*` and reserves the
 * restriction for `_`. That is what keeps `**重要**です` bold. The cost is that
 * `2*3*4` emphasises `3` in the composer, which is why the lone `*` rule is
 * `editorOnly` and the bubble never sees it.
 *
 * One consequence worth naming: `_斜体_です` stays literal, because the closing
 * `_` sits against a letter. CommonMark agrees, and CJK users reach for `**`.
 *
 * Order matters. The longer marker of a pair has to run first, or the shorter
 * one consumes it: `**` before `*`, and `__`/`++` before `_`. Code is listed
 * last but binds tightest: `applyInlineRules` shields code spans before any
 * emphasis rule runs, so `` `**x**` `` is literal text inside code.
 *
 * Every pattern excludes newlines, so a marker cannot pair across a line break.
 * The composer could never do that (it works a line or a text node at a time),
 * so the bubble matches it rather than the other way round.
 */
export const INLINE_RULES: readonly InlineRule[] = [
  {
    format: 'bold',
    pattern: /\*\*([^*\n]+)\*\*/gm,
    anchored: /\*\*([^*\n]+)\*\*$/,
  },
  {
    format: 'bold',
    pattern: /(?<!\*)\*([^*\n]+)\*(?!\*)/gm,
    anchored: /(?<!\*)\*([^*\n]+)\*$/,
    editorOnly: true,
  },
  {
    format: 'underline',
    pattern: /(?<![\p{L}\p{N}])__([^_\n]+)__(?![\p{L}\p{N}])/gmu,
    anchored: /(?<![\p{L}\p{N}])__([^_\n]+)__$/u,
  },
  {
    format: 'underline',
    pattern: /\+\+([^+\n]+)\+\+/gm,
    anchored: /\+\+([^+\n]+)\+\+$/,
  },
  {
    format: 'strikethrough',
    pattern: /~~([^~\n]+)~~/gm,
    anchored: /~~([^~\n]+)~~$/,
  },
  {
    // The guard also excludes a neighbouring `_`, or typing the third
    // underscore of `__under__` would match `_under_` and italicise it before
    // the underline rule ever sees the pair.
    format: 'italic',
    pattern: /(?<![\p{L}\p{N}_])_([^_\n]+)_(?![\p{L}\p{N}_])/gmu,
    anchored: /(?<![\p{L}\p{N}_])_([^_\n]+)_$/u,
  },
  {
    format: 'code',
    pattern: /`([^`\n]+)`/g,
    anchored: /`([^`\n]+)`$/,
  },
];

/** Tags used where the output is read-only HTML: bubble, previews, search. */
export const RENDER_TAGS: Readonly<Record<InlineFormat, string>> = {
  bold: 'b',
  italic: 'i',
  underline: 'u',
  strikethrough: 's',
  code: 'code',
};

/**
 * Tags used inside the contenteditable composer. `strong`/`em` are what
 * `document.execCommand` and the browser produce natively, so matching them
 * keeps the editor's own state handling consistent. They render identically to
 * `b`/`i`, and the HTML-to-markdown conversion on send treats them the same.
 */
export const EDITOR_TAGS: Readonly<Record<InlineFormat, string>> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's',
  code: 'code',
};

/**
 * Remove the zero-width spaces the composer uses to park the caret after a
 * converted span. They are editor artifacts, never content, but they are not
 * whitespace to a regex: left in place, `**bold**` followed by one fails the
 * closing word-boundary check and renders with its asterisks showing.
 *
 * Only U+200B is removed. U+200D (zero-width joiner) is deliberately kept,
 * because it binds multi-codepoint emoji such as 👨‍👩‍👧 together.
 */
export function stripCaretMarkers(text: string): string {
  return text.replace(/\u200B/g, '');
}

/** An inline code span, shielded before the emphasis rules run. */
const CODE_SPAN = /`[^`\n]+`/g;
const CODE_SPAN_PLACEHOLDER = /\u200B\uFFFCCODE(\d+)\uFFFC\u200B/g;

export interface ApplyInlineOptions {
  /** Include rules marked `editorOnly`. Off for read-only surfaces. */
  editor?: boolean;
  /** Restrict to these formats, still in table order. Defaults to all. */
  formats?: readonly InlineFormat[];
}

/**
 * Convert the inline markers in `text` to `tags`, in table order.
 *
 * The caller is responsible for shielding anything the rules must not touch
 * (URLs, code blocks, mention tokens) before calling this.
 */
export function applyInlineRules(
  text: string,
  tags: Readonly<Record<InlineFormat, string>>,
  options: ApplyInlineOptions = {}
): string {
  const { editor = false, formats } = options;
  const codeRule = INLINE_RULES.find(rule => rule.format === 'code');

  // A code span binds tighter than the emphasis markers, so `**x**` is literal
  // text inside code rather than bold. Shield the spans before anything else
  // runs. This happens even when the caller is not converting code on this
  // pass, so that a marker inside a code span is never consumed early.
  const spans: string[] = [];
  let result = text.replace(CODE_SPAN, match => {
    const index = spans.length;
    spans.push(match);
    return `\u200B\uFFFCCODE${String(index)}\uFFFC\u200B`;
  });

  for (const rule of INLINE_RULES) {
    if (rule.format === 'code') continue;
    if (rule.editorOnly && !editor) continue;
    if (formats && !formats.includes(rule.format)) continue;
    const tag = tags[rule.format];
    result = result.replace(rule.pattern, `<${tag}>$1</${tag}>`);
  }

  // Put the code spans back, converting them only if this pass handles code.
  // The bubble defers that until after links and lists have been processed.
  const convertCode = !formats || formats.includes('code');
  return result.replace(CODE_SPAN_PLACEHOLDER, (_match, index: string) => {
    const span = spans[parseInt(index, 10)] ?? '';
    if (!convertCode || !codeRule) return span;
    return span.replace(codeRule.pattern, `<${tags.code}>$1</${tags.code}>`);
  });
}
