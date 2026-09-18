/**
 * MarkdownDetector — detects and converts inline markdown syntax as the user types.
 *
 * Fires on every `input` event. Checks the text before the cursor in the
 * current text node for a completed inline pattern (closing marker just typed).
 *
 * Inline marker conversions come from INLINE_RULES (see utils/markdownInline),
 * the same table the message bubble and the paste pass use. Handled here on top
 * of those:
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
import { markersInsideUrl } from '../../urlShielding';
import { INLINE_RULES, EDITOR_TAGS } from '../../markdownInline';
import { fixOrderedListContinuation } from '../formats/ListFormat';

/**
 * Attempt to detect and convert inline markdown at the current cursor position.
 * Returns true if a conversion was applied, false otherwise.
 */
export function detectAndConvertMarkdown(ctx: EditorContext): boolean {
  const sel = ctx.getWindow().getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) return false;

  const text = textNode.textContent ?? '';
  const cursor = range.startOffset;
  const before = text.substring(0, cursor);

  // Inline markers, from the table shared with the bubble and the paste pass, so
  // the composer preview cannot support a marker the sent message does not.
  for (const rule of INLINE_RULES) {
    const match = rule.anchored.exec(before);
    if (!match) continue;
    // Markers inside a URL are address characters, not formatting.
    if (markersInsideUrl(text, cursor - match[0].length, cursor)) continue;
    applyInlineFormat(textNode, match, EDITOR_TAGS[rule.format].toUpperCase(), cursor);
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

  const doc = textNode.ownerDocument;
  if (!doc) return;
  const range = doc.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  range.deleteContents();

  const el = doc.createElement(tag);
  el.textContent = content;
  range.insertNode(el);

  // Place cursor in a ZWS text node after the element so the next keystroke
  // is typed outside the formatted span.
  const exit = doc.createTextNode('\u200B');
  el.after(exit);
  const newRange = doc.createRange();
  newRange.setStart(exit, 1);
  newRange.collapse(true);
  const sel = doc.defaultView?.getSelection();
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

  const doc = textNode.ownerDocument;
  if (!doc) return;
  const range = doc.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  range.deleteContents();

  const a = doc.createElement('a');
  a.href = url;
  a.textContent = label;
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  range.insertNode(a);

  const exit = doc.createTextNode('\u200B');
  a.after(exit);
  const newRange = doc.createRange();
  newRange.setStart(exit, 1);
  newRange.collapse(true);
  const sel = doc.defaultView?.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(newRange);
}

// Re-export so callers that only import from this file still work
export { applyListStyles, fixOrderedListContinuation };
