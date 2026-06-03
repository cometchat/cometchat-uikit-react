/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * AutoListDetector — detects Slack-style auto-block patterns as the user types.
 *
 * Triggered on the Space key. Matches implementation.
 *
 * Patterns (at start of line):
 *   1. + Space  → ordered list
 *   -  + Space  → bullet list
 *   *  + Space  → bullet list
 *   >  + Space  → blockquote
 *   ``` + Space → code block
 */

import type { EditorContext } from '../formats/format.types';
import { applyListStyles, fixOrderedListContinuation } from './MarkdownDetector';

export function detectAndConvertAutoList(ctx: EditorContext): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  const offset = range.startOffset;

  if (node.nodeType !== Node.TEXT_NODE) return false;
  if (ctx.hasAncestor(node, 'OL') || ctx.hasAncestor(node, 'UL')) return false;

  const currentText = (node.textContent ?? '').substring(0, offset);
  const prevSiblingText = getPrevSiblingText(node);
  const linePrefix = (prevSiblingText + currentText).replace(/\u200B/g, '');

  if (!isAtStartOfBlock(node, ctx.element)) return false;

  let listType: 'OL' | 'UL' | null = null;

  if (linePrefix === '1.') {
    listType = 'OL';
  } else if (linePrefix === '-' || linePrefix === '*') {
    listType = 'UL';
  } else if (linePrefix === '>') {
    if (ctx.hasAncestor(node, 'BLOCKQUOTE')) return false;
    ctx.markFormattingApplied();
    deletePrefixFromDOM(node, offset, prevSiblingText);
    applyBlockquote(ctx);
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
    return true;
  } else if (linePrefix === '```') {
    if (ctx.hasAncestor(node, 'PRE')) return false;
    ctx.markFormattingApplied();
    deletePrefixFromDOM(node, offset, prevSiblingText);
    applyCodeBlock(ctx);
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
    return true;
  }

  if (!listType) return false;

  ctx.markFormattingApplied();
  deletePrefixFromDOM(node, offset, prevSiblingText);

  if (listType === 'OL') {
    document.execCommand('insertOrderedList', false);
    fixOrderedListContinuation(ctx.element);
  } else {
    document.execCommand('insertUnorderedList', false);
  }
  applyListStyles(ctx.element);
  ctx.updateFormatState();
  ctx.pushHistory();
  ctx.emitUpdate();
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the text content of the immediately preceding text-node sibling,
 * stripping ZWS. Returns '' if there is none.
 * This handles the browser splitting "1." into "1" + "." nodes.
 */
function getPrevSiblingText(node: Node): string {
  let prev = node.previousSibling;
  while (prev) {
    if (prev.nodeType === Node.TEXT_NODE) {
      return (prev.textContent ?? '').replace(/\u200B/g, '');
    }
    if (prev.nodeType === Node.ELEMENT_NODE && (prev.textContent ?? '').trim() !== '') {
      return '';
    }
    prev = prev.previousSibling;
  }
  return '';
}

/**
 * Check that there is no meaningful text before `node` in its parent block.
 * Matches check.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAtStartOfBlock(node: Node, _editorEl: HTMLElement): boolean {
  const parent = node.parentElement;
  if (!parent) return true;

  let precedingText = '';
  for (const child of Array.from(parent.childNodes)) {
    if (child === node) break;
    precedingText += (child.textContent ?? '').replace(/\u200B/g, '');
  }
  return precedingText.trim().length === 0;
}

/**
 * Delete the prefix text from the DOM.
 *
 * If the prefix spans two text nodes (prevSibling + current), delete both.
 * Uses Range.deleteContents() — pure DOM, keeps cursor at deletion point.
 * Then restores the collapsed range as the active selection.
 */
function deletePrefixFromDOM(caretNode: Node, caretOffset: number, prevSiblingText: string): void {
  const sel = window.getSelection();
  const r = document.createRange();

  if (prevSiblingText.length > 0 && caretNode.previousSibling?.nodeType === Node.TEXT_NODE) {
    r.setStart(caretNode.previousSibling as Text, 0);
  } else {
    r.setStart(caretNode, 0);
  }
  r.setEnd(caretNode, caretOffset);
  r.deleteContents();

  if (sel) {
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

function applyBlockquote(ctx: EditorContext): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  let block: Node | null = range.startContainer;
  while (block && block !== ctx.element) {
    if (
      block.nodeType === Node.ELEMENT_NODE &&
      ['P', 'DIV', 'LI'].includes((block as Element).tagName)
    )
      break;
    block = block.parentNode;
  }

  const bq = document.createElement('blockquote');
  bq.style.borderLeft = '3px solid var(--cometchat-primary-color, #6852d6)';
  bq.style.margin = '0';
  bq.style.paddingLeft = '12px';

  if (block && block !== ctx.element) {
    block.parentNode?.insertBefore(bq, block);
    bq.appendChild(block);
  } else {
    const p = document.createElement('p');
    p.style.margin = '0';
    const tn = range.startContainer;
    if (tn.nodeType === Node.TEXT_NODE && tn.parentNode === ctx.element) {
      tn.parentNode.insertBefore(bq, tn);
      p.appendChild(tn);
    } else {
      ctx.element.appendChild(bq);
    }
    bq.appendChild(p);
  }

  const inner = bq.querySelector('p, div, li') ?? bq;
  const nr = document.createRange();
  nr.setStart(inner, inner.childNodes.length);
  nr.collapse(true);
  sel.removeAllRanges();
  sel.addRange(nr);
}

function applyCodeBlock(ctx: EditorContext): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const pre = document.createElement('pre');
  pre.style.cssText =
    'background:var(--cometchat-neutral-color-200,#f5f5f5);border-radius:4px;padding:8px 12px;margin:4px 0;font-family:monospace;white-space:pre-wrap;overflow-x:auto';

  const code = document.createElement('code');
  code.textContent = '\u200B';
  pre.appendChild(code);

  let block: Node | null = range.startContainer;
  while (block && block !== ctx.element) {
    if (block.nodeType === Node.ELEMENT_NODE && ['P', 'DIV'].includes((block as Element).tagName))
      break;
    block = block.parentNode;
  }

  if (block && block !== ctx.element) {
    block.parentNode?.insertBefore(pre, block);
    if (((block as HTMLElement).textContent ?? '').replace(/\u200B/g, '').trim() === '') {
      block.parentNode?.removeChild(block);
    }
  } else {
    range.insertNode(pre);
  }

  const nr = document.createRange();
  if (code.firstChild) {
    nr.setStart(code.firstChild, 1);
  } else {
    nr.setStart(code, 0);
  }
  nr.collapse(true);
  sel.removeAllRanges();
  sel.addRange(nr);
}
