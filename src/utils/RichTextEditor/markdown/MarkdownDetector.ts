/**
 * MarkdownDetector — detects and converts inline markdown syntax as the user types.
 *
 * Fires on every `input` event. Checks the text before the cursor in the
 * current text node for a completed inline pattern (closing marker just typed).
 *
 * Supported inline conversions:
 * - **text**        → <strong>
 * - *text*          → <strong>  (single asterisk)
 * - _text_          → <em>
 * - ~~text~~        → <s>
 * - `text`          → <code>
 * - [label](url)    → <a href="url">label</a>
 * - <u>text</u>     → <u>
 *
 * Block conversions (triggered on Space key via AutoListDetector):
 * - > (space)       → blockquote
 * - ``` (space/enter) → code block
 * These are handled in AutoListDetector so they share the same Space-key hook.
 */

import type { EditorContext } from '../formats/format.types';
import { applyListStyles } from '../formats/ListFormat';
import { fixOrderedListContinuation } from '../formats/ListFormat';

/**
 * Attempt to detect and convert inline markdown at the current cursor position.
 * Returns true if a conversion was applied, false otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function detectAndConvertMarkdown(_ctx?: EditorContext): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) return false;

  const text = textNode.textContent ?? '';
  const cursor = range.startOffset;
  const before = text.substring(0, cursor);

  // ── Bold: **text** ──────────────────────────────────────────────────────────
  const boldDouble = /\*\*([^*\n]+)\*\*$/.exec(before);
  if (boldDouble) {
    applyInlineFormat(textNode, boldDouble, 'STRONG', cursor);
    return true;
  }

  // ── Bold: *text* (single asterisk) ─────────────────────────────────────────
  const boldSingle = /(?<!\*)\*([^*\n]+)\*$/.exec(before);
  if (boldSingle) {
    applyInlineFormat(textNode, boldSingle, 'STRONG', cursor);
    return true;
  }

  // ── Italic: _text_ ──────────────────────────────────────────────────────────
  const italic = /(?<!_)_([^_\n]+)_$/.exec(before);
  if (italic) {
    applyInlineFormat(textNode, italic, 'EM', cursor);
    return true;
  }

  // ── Strikethrough: ~~text~~ ─────────────────────────────────────────────────
  const strike = /~~([^~\n]+)~~$/.exec(before);
  if (strike) {
    applyInlineFormat(textNode, strike, 'S', cursor);
    return true;
  }

  // ── Inline code: `text` ─────────────────────────────────────────────────────
  const code = /`([^`\n]+)`$/.exec(before);
  if (code) {
    applyInlineFormat(textNode, code, 'CODE', cursor);
    return true;
  }

  // ── Underline: <u>text</u> ──────────────────────────────────────────────────
  const underline = /<u>([^<\n]+)<\/u>$/.exec(before);
  if (underline) {
    applyInlineFormat(textNode, underline, 'U', cursor);
    return true;
  }

  // ── Link: [label](url) ──────────────────────────────────────────────────────
  const link = /\[([^\]]+)\]\(([^)\s]+)\)$/.exec(before);
  if (link) {
    applyLinkFormat(textNode, link, cursor);
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replace the matched markdown syntax in `textNode` with a formatted element.
 * `cursor` is the current caret offset inside the text node (= end of match).
 */
function applyInlineFormat(
  textNode: Node,
  match: RegExpMatchArray,
  tag: string,
  cursor: number
): void {
  const fullMatch = match[0];
  const content = match[1] ?? '';

  const end = cursor;
  const start = end - fullMatch.length;

  const range = document.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  range.deleteContents();

  const el = document.createElement(tag);
  el.textContent = content;
  range.insertNode(el);

  // Place cursor in a ZWS text node after the element so the next keystroke
  // is typed outside the formatted span.
  const exit = document.createTextNode('\u200B');
  el.after(exit);
  const newRange = document.createRange();
  newRange.setStart(exit, 1);
  newRange.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(newRange);
}

/**
 * Replace `[label](url)` with an `<a>` element.
 */
function applyLinkFormat(textNode: Node, match: RegExpMatchArray, cursor: number): void {
  const fullMatch = match[0];
  const label = match[1] ?? '';
  const url = match[2] ?? '';

  const end = cursor;
  const start = end - fullMatch.length;

  const range = document.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  range.deleteContents();

  const a = document.createElement('a');
  a.href = url;
  a.textContent = label;
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  range.insertNode(a);

  const exit = document.createTextNode('\u200B');
  a.after(exit);
  const newRange = document.createRange();
  newRange.setStart(exit, 1);
  newRange.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(newRange);
}

// Re-export so callers that only import from this file still work
export { applyListStyles, fixOrderedListContinuation };
