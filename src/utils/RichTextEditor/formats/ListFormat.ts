/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * ListFormat — ordered and unordered list handling.
 *
 * Design principles (learned from ProseMirror/Tiptap/Slate research):
 * 1. Use execCommand('insertOrderedList'/'insertUnorderedList') for list creation
 *    — the browser handles the DOM structure correctly.
 * 2. Use execCommand('insertParagraph') for Enter inside a list item
 *    — the browser creates a new <li> correctly.
 * 3. Apply inline styles after every list operation to ensure correct rendering.
 * 4. The browser may wrap content in <div> inside <li> — this is normal and
 *    handled by CSS (display:contents on the div, or by normalizing after input).
 *
 * Enter key behavior (Slack-style):
 * - Empty list item → exit the list (insert <br> after)
 * - Non-empty list item → create new list item (via execCommand)
 */

import type { EditorContext, FormatCommand } from './format.types';

/**
 * Fix ordered list numbering continuation (Slack-style).
 * When ordered lists are separated by unordered lists, the numbering continues.
 * Only non-list content (paragraphs, text, etc.) resets the count.
 */
export function fixOrderedListContinuation(element: HTMLDivElement): void {
  const children = Array.from(element.children);
  let runningCount = 0;

  for (const child of children) {
    if (child.tagName === 'OL') {
      const ol = child as HTMLOListElement;
      if (runningCount > 0) {
        ol.start = runningCount + 1;
      } else {
        ol.start = 1;
      }
      runningCount += ol.querySelectorAll(':scope > li').length;
    } else if (child.tagName === 'UL') {
      // Unordered lists do NOT reset the ordered list counter (Slack behavior)
      // The count carries through UL interruptions
    } else {
      // Non-list content resets the counter
      runningCount = 0;
    }
  }
}

/**
 * Apply inline styles to list elements for correct cross-browser rendering.
 * This is the approach used by Slack, Notion, and other editors.
 */
export function applyListStyles(element: HTMLElement): void {
  const olStyles = ['decimal', 'lower-alpha', 'lower-roman'];
  const ulStyles = ['disc', 'circle', 'square'];

  const getDepth = (el: Element): number => {
    let depth = 0;
    let parent = el.parentElement;
    while (parent && parent !== element) {
      if (parent.tagName === 'OL' || parent.tagName === 'UL') depth++;
      parent = parent.parentElement;
    }
    return depth;
  };

  element.querySelectorAll('ol').forEach(ol => {
    const depth = getDepth(ol);
    ol.style.listStyleType = olStyles[depth % olStyles.length] ?? 'decimal';
    ol.style.listStylePosition = 'inside';
    ol.style.paddingLeft = depth > 0 ? '1.5em' : '0';
    ol.style.margin = '0';
  });

  element.querySelectorAll('ul').forEach(ul => {
    const depth = getDepth(ul);
    ul.style.listStyleType = ulStyles[depth % ulStyles.length] ?? 'disc';
    ul.style.listStylePosition = 'inside';
    ul.style.paddingLeft = depth > 0 ? '1.5em' : '0';
    ul.style.margin = '0';
  });

  element.querySelectorAll('li').forEach(li => {
    (li as HTMLElement).style.display = 'list-item';
    (li as HTMLElement).style.margin = '0';
    (li as HTMLElement).style.paddingLeft = '0';
    (li as HTMLElement).style.textIndent = '';
    // Make any browser-inserted div/p inside li transparent to layout
    for (const child of Array.from(li.children)) {
      const el = child as HTMLElement;
      if (el.tagName === 'DIV' || el.tagName === 'P') {
        el.style.display = 'inline';
        el.style.margin = '0';
        el.style.padding = '0';
      }
    }
  });
}

/**
 * Check if cursor is inside a list item.
 */
function getListItem(ctx: EditorContext): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return ctx.findAncestor(sel.getRangeAt(0).startContainer, 'LI') as HTMLElement | null;
}

/**
 * Check if the list item is empty (ignoring <br> and zero-width spaces).
 */
function isListItemEmpty(li: HTMLElement): boolean {
  const text = (li.textContent ?? '').replace(/\u200B/g, '').trim();
  return text === '';
}

/**
 * Handle Enter key inside a list (Slack-style):
 * - Empty list item → exit the list
 * - Non-empty list item → new list item via execCommand
 * Returns true if handled.
 */
export function handleListEnter(e: KeyboardEvent, ctx: EditorContext): boolean {
  const li = getListItem(ctx);
  if (!li) return false;

  const listParent = li.parentElement;
  if (!listParent || (listParent.tagName !== 'OL' && listParent.tagName !== 'UL')) return false;

  e.preventDefault();

  if (isListItemEmpty(li)) {
    // Empty list item → exit the list
    li.remove();

    const p = document.createElement('p');
    p.innerHTML = '<br>';

    if (listParent.children.length === 0) {
      listParent.parentNode?.replaceChild(p, listParent);
    } else {
      listParent.parentNode?.insertBefore(p, listParent.nextSibling);
    }

    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } else {
    // Non-empty → use execCommand to create new list item
    // execCommand('insertParagraph') inside a <li> creates a new sibling <li>
    document.execCommand('insertParagraph');
    fixOrderedListContinuation(ctx.element);
    applyListStyles(ctx.element);
  }

  ctx.markFormattingApplied();
  ctx.updateFormatState();
  ctx.pushHistory();
  ctx.emitUpdate();
  return true;
}

// ==================== Format Commands ====================

export const OrderedListFormat: FormatCommand = {
  id: 'orderedList',
  name: 'Ordered List',

  execute(ctx: EditorContext): void {
    // Atomic: if a code block is active, capture its text, remove it,
    // then insert the list at the same position.
    const preEl = findActivePre(ctx);
    if (preEl) {
      replacePreWithList(preEl, 'OL', ctx);
      ctx.markFormattingApplied();
      ctx.updateFormatState();
      ctx.pushHistory();
      ctx.emitUpdate();
      return;
    }

    // Bug fix #1: Ensure there's a valid selection inside the editor before execCommand.
    // On empty editor or after Ctrl+A clear, execCommand fails silently.
    ensureEditorHasSelection(ctx);

    const result = document.execCommand('insertOrderedList', false);
    if (!result || !ctx.element.querySelector('ol')) {
      // Fallback: manually create list if execCommand failed
      manuallyCreateList('ol', ctx);
    }
    fixOrderedListContinuation(ctx.element);
    applyListStyles(ctx.element);

    // Bug fix #3: Place cursor at end of text content after applying list
    placeCursorAtEndOfList(ctx);

    ctx.markFormattingApplied();
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return ctx.hasAncestor(node, 'OL');
  },
};

export const BulletListFormat: FormatCommand = {
  id: 'bulletList',
  name: 'Bullet List',

  execute(ctx: EditorContext): void {
    const preEl = findActivePre(ctx);
    if (preEl) {
      replacePreWithList(preEl, 'UL', ctx);
      ctx.markFormattingApplied();
      ctx.updateFormatState();
      ctx.pushHistory();
      ctx.emitUpdate();
      return;
    }

    // Bug fix #1: Ensure there's a valid selection inside the editor before execCommand.
    ensureEditorHasSelection(ctx);

    const result = document.execCommand('insertUnorderedList', false);
    if (!result || !ctx.element.querySelector('ul')) {
      manuallyCreateList('ul', ctx);
    }
    applyListStyles(ctx.element);
    // Fix ordered list continuation — converting OL items to UL splits the OL,
    // and the second OL fragment needs its start attribute updated.
    fixOrderedListContinuation(ctx.element);

    // Bug fix #3: Place cursor at end of text content after applying list
    placeCursorAtEndOfList(ctx);

    ctx.markFormattingApplied();
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return ctx.hasAncestor(node, 'UL');
  },
};

function findActivePre(ctx: EditorContext): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return (ctx.findAncestor(range.startContainer, 'PRE') ??
    ctx.element.querySelector('pre')) as HTMLElement | null;
}

/**
 * Atomically replace a <pre> with a list (<ol> or <ul>).
 * Each line of the code block becomes a list item.
 */
function replacePreWithList(preEl: HTMLElement, tag: 'OL' | 'UL', ctx: EditorContext): void {
  const text = (preEl.textContent ?? '').replace(/\u200B/g, '');
  const insertParent = preEl.parentNode;
  if (!insertParent) return;
  const insertBefore = preEl.nextSibling;
  preEl.remove();

  const list = document.createElement(tag);
  const lines = text ? text.split('\n') : [''];
  for (const line of lines) {
    const li = document.createElement('li');
    li.textContent = line || '\u200B';
    list.appendChild(li);
  }
  insertParent.insertBefore(list, insertBefore);
  applyListStyles(ctx.element);
  if (tag === 'OL') fixOrderedListContinuation(ctx.element);

  // Place cursor at end of last list item
  const lastLi = list.lastElementChild as HTMLElement | null;
  if (lastLi) {
    const sel = window.getSelection();
    if (sel) {
      const r = document.createRange();
      r.selectNodeContents(lastLi);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }
}

/**
 * Bug fix #1: Ensure the editor has a valid selection/range for execCommand to work.
 * On empty editor or after Ctrl+A clear, execCommand('insertOrderedList') fails
 * because there's no valid selection anchor inside the editor.
 */
function ensureEditorHasSelection(ctx: EditorContext): void {
  ctx.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !ctx.element.contains(sel.anchorNode)) {
    // Force a valid cursor position inside the editor
    if (ctx.element.innerHTML.trim() === '' || ctx.element.innerHTML === '<br>') {
      // Empty editor: insert a paragraph to give execCommand something to work with
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      ctx.element.innerHTML = '';
      ctx.element.appendChild(p);
      const range = document.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else {
      // Non-empty but no valid selection: place cursor at end
      const range = document.createRange();
      range.selectNodeContents(ctx.element);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }
}

/**
 * Bug fix #3: Place cursor at end of text in the current list item after applying list.
 * execCommand('insertOrderedList') sometimes leaves cursor at position 0.
 */
function placeCursorAtEndOfList(ctx: EditorContext): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  // Find the list item the cursor is in
  let node: Node | null = sel.anchorNode;
  let li: HTMLElement | null = null;
  while (node && node !== ctx.element) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'LI') {
      li = node as HTMLElement;
      break;
    }
    node = node.parentNode;
  }
  if (!li) return;

  // Only move cursor if it's at position 0 and there's text content
  const text = (li.textContent ?? '').replace(/\u200B/g, '');
  if (text.length > 0 && sel.anchorOffset === 0) {
    const range = document.createRange();
    range.selectNodeContents(li);
    range.collapse(false); // collapse to end
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/**
 * Fallback: manually create a list when execCommand fails.
 */
function manuallyCreateList(tag: 'ol' | 'ul', ctx: EditorContext): void {
  const sel = window.getSelection();
  const list = document.createElement(tag);
  const li = document.createElement('li');

  // Get current text content and use it as the first list item
  const currentText = ctx.element.textContent?.trim() ?? '';
  if (currentText) {
    li.textContent = currentText;
    ctx.element.innerHTML = '';
  } else {
    li.innerHTML = '<br>';
  }

  list.appendChild(li);
  ctx.element.appendChild(list);

  // Place cursor at end of list item
  if (sel) {
    const range = document.createRange();
    range.selectNodeContents(li);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
