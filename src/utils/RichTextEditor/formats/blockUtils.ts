/**
 * blockUtils — shared helpers for mutual-exclusion between block formats.
 *
 * Code Block, Blockquote, and Lists are mutually exclusive:
 * - Applying Code Block removes any active Blockquote or List first
 * - Applying Blockquote removes any active Code Block first
 * - Applying a List removes any active Code Block first
 *
 * Each helper removes the block element and returns the extracted plain text
 * so the caller can re-insert it in the new format.
 */

import type { EditorContext } from './format.types';

/**
 * If the cursor/selection is inside a <pre>, remove it and return its text content.
 * The text is split into lines and each line is inserted as a <p> in place of the <pre>.
 * Returns true if a code block was removed.
 */
export function removeCodeBlockIfActive(ctx: EditorContext): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);

  // Also check the entire editor for <pre> elements when there's a selection
  // (user may have selected all content which includes a <pre>)
  const pre =
    (ctx.findAncestor(range.startContainer, 'PRE') as HTMLElement | null) ??
    (range.collapsed ? null : findPreInSelection(ctx.element));

  if (!pre) return false;

  const parent = pre.parentNode;
  if (!parent) return false;

  const text = (pre.textContent ?? '').replace(/\u200B/g, '');
  const lines = text ? text.split('\n') : [''];

  const fragment = document.createDocumentFragment();
  for (const line of lines) {
    const p = document.createElement('p');
    p.textContent = line || '\u200B';
    fragment.appendChild(p);
  }

  const lastP = fragment.lastChild as HTMLElement | null;
  parent.insertBefore(fragment, pre);
  pre.remove();

  if (lastP) {
    const newRange = document.createRange();
    newRange.selectNodeContents(lastP);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  return true;
}

/**
 * If the cursor/selection is inside a <blockquote>, remove it and keep its children.
 * Returns true if a blockquote was removed.
 */
export function removeBlockquoteIfActive(ctx: EditorContext): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const bq =
    (ctx.findAncestor(range.startContainer, 'BLOCKQUOTE') as HTMLElement | null) ??
    (range.collapsed ? null : findBlockquoteInSelection(ctx.element));

  if (!bq) return false;

  const parent = bq.parentNode;
  if (!parent) return false;

  // Move all children out before the blockquote
  const lastChild = bq.lastChild;
  while (bq.firstChild) {
    parent.insertBefore(bq.firstChild, bq);
  }
  bq.remove();

  if (lastChild) {
    const newRange = document.createRange();
    newRange.selectNodeContents(lastChild);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  return true;
}

/**
 * If the cursor/selection is inside a list (OL/UL), remove it and keep text as paragraphs.
 * Returns true if a list was removed.
 */
export function removeListIfActive(ctx: EditorContext): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const list =
    ((ctx.findAncestor(range.startContainer, 'OL') ??
      ctx.findAncestor(range.startContainer, 'UL')) as HTMLElement | null) ??
    (range.collapsed ? null : findListInSelection(ctx.element));

  if (!list) return false;

  const parent = list.parentNode;
  if (!parent) return false;

  const items = Array.from(list.querySelectorAll('li'));
  const fragment = document.createDocumentFragment();
  for (const li of items) {
    const p = document.createElement('p');
    p.innerHTML = li.innerHTML || '<br>';
    fragment.appendChild(p);
  }

  const lastP = fragment.lastChild as HTMLElement | null;
  parent.insertBefore(fragment, list);
  list.remove();

  if (lastP) {
    const newRange = document.createRange();
    newRange.selectNodeContents(lastP);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  return true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findPreInSelection(editorEl: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer as HTMLElement;
  const root =
    container.nodeType === Node.ELEMENT_NODE ? container : (container.parentElement ?? editorEl);
  return root.querySelector('pre') ?? editorEl.querySelector('pre');
}

function findBlockquoteInSelection(editorEl: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer as HTMLElement;
  const root =
    container.nodeType === Node.ELEMENT_NODE ? container : (container.parentElement ?? editorEl);
  return root.querySelector('blockquote') ?? editorEl.querySelector('blockquote');
}

function findListInSelection(editorEl: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer as HTMLElement;
  const root =
    container.nodeType === Node.ELEMENT_NODE ? container : (container.parentElement ?? editorEl);
  return (root.querySelector('ol') ??
    root.querySelector('ul') ??
    editorEl.querySelector('ol') ??
    editorEl.querySelector('ul')) as HTMLElement | null;
}
