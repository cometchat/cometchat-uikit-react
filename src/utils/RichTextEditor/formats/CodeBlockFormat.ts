/**
 * CodeBlockFormat — handles wrapping/unwrapping content in <pre><code> blocks.
 *
 * Toggle behavior:
 * - If cursor is inside a <pre>, unwrap it back to a <p>.
 * - If cursor is outside a <pre>, wrap the selection (or insert empty) in <pre><code>.
 *
 * When wrapping a selection that contains block elements (lists, paragraphs, etc.),
 * each block is converted to a line in the code block, preserving the text structure.
 */

import type { EditorContext, FormatCommand } from './format.types';

function findActiveList(ctx: EditorContext): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return (ctx.findAncestor(range.startContainer, 'OL') ??
    ctx.findAncestor(range.startContainer, 'UL') ??
    ctx.element.querySelector('ol, ul')) as HTMLElement | null;
}

function findActiveBlockquote(ctx: EditorContext): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return (ctx.findAncestor(range.startContainer, 'BLOCKQUOTE') ??
    ctx.element.querySelector('blockquote')) as HTMLElement | null;
}

/**
 * Extract plain text from a DOM fragment, inserting newlines between block-level elements.
 * This preserves the visual line structure when converting lists/paragraphs to code.
 */
function extractTextWithNewlines(node: Node): string {
  const blockTags = new Set([
    'P',
    'DIV',
    'LI',
    'BLOCKQUOTE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'PRE',
    'BR',
  ]);
  const lines: string[] = [];

  function walk(n: Node): void {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent ?? '';
      if (text) {
        // Append to the last line or start a new one
        if (lines.length === 0) {
          lines.push(text);
        } else {
          lines[lines.length - 1] = (lines[lines.length - 1] ?? '') + text;
        }
      }
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as HTMLElement;
      const tag = el.tagName;

      if (tag === 'BR') {
        lines.push('');
        return;
      }

      const isBlock = blockTags.has(tag);

      if (isBlock && lines.length > 0 && lines[lines.length - 1] !== '') {
        // Start a new line before block elements (except the very first)
        lines.push('');
      }

      for (const child of Array.from(n.childNodes)) {
        walk(child);
      }

      if (isBlock) {
        // Ensure next content starts on a new line after block elements
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('');
        }
      }
    }
  }

  walk(node);

  // Remove trailing empty line
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

export const CodeBlockFormat: FormatCommand = {
  id: 'codeBlock',
  name: 'Code Block',

  execute(ctx: EditorContext): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const existingPre = ctx.findAncestor(range.startContainer, 'PRE');

    if (existingPre) {
      // Toggle off — unwrap <pre><code> back to paragraphs
      const preEl = existingPre as HTMLElement;
      const text = preEl.textContent ?? '';
      const parent = preEl.parentNode;
      if (!parent) return;

      const lines = text.split('\n');
      const fragment = document.createDocumentFragment();
      for (const line of lines) {
        const p = document.createElement('p');
        p.textContent = line || '\u200B';
        fragment.appendChild(p);
      }
      parent.insertBefore(fragment, preEl);
      preEl.remove();

      const lastP = parent.querySelector('p:last-of-type') ?? parent.lastElementChild;
      if (lastP) {
        const newRange = document.createRange();
        newRange.selectNodeContents(lastP);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else {
      // Capture text from list/blockquote BEFORE removing them, then replace
      // with a single <pre><code> at the same DOM position.
      const listEl = findActiveList(ctx);
      const bqEl = !listEl ? findActiveBlockquote(ctx) : null;

      let text: string;
      let insertAnchor: { parent: Node; before: Node | null } | null = null;

      if (listEl) {
        text = Array.from(listEl.querySelectorAll('li'))
          .map(li => (li.textContent ?? '').replace(/\u200B/g, ''))
          .join('\n');
        const listParent = listEl.parentNode;
        if (!listParent) return;
        insertAnchor = { parent: listParent, before: listEl.nextSibling };
        listEl.remove();
      } else if (bqEl) {
        text = (bqEl.textContent ?? '').replace(/\u200B/g, '');
        const bqParent = bqEl.parentNode;
        if (!bqParent) return;
        insertAnchor = { parent: bqParent, before: bqEl.nextSibling };
        bqEl.remove();
      } else {
        // No list/blockquote — extract selected content normally.
        // Bug fix #3: When selection is collapsed (no text selected), wrap the
        // entire content of the current block (p, div) or the editor if at root.
        if (range.collapsed) {
          const blockTags = new Set([
            'P',
            'DIV',
            'LI',
            'BLOCKQUOTE',
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6',
          ]);
          let currentBlock: HTMLElement | null = null;
          let cur: Node | null = range.startContainer;
          while (cur && cur !== ctx.element) {
            if (cur.nodeType === Node.ELEMENT_NODE && blockTags.has((cur as Element).tagName)) {
              currentBlock = cur as HTMLElement;
              break;
            }
            cur = cur.parentNode;
          }
          if (currentBlock) {
            const blockText = (currentBlock.textContent ?? '').replace(/\u200B/g, '');
            text = blockText || '';
            const blockParent = currentBlock.parentNode;
            if (blockParent) {
              insertAnchor = { parent: blockParent, before: currentBlock.nextSibling };
              currentBlock.remove();
            }
          } else {
            // Cursor at root level — wrap all editor content
            text = extractTextWithNewlines(ctx.element).replace(/\u200B/g, '');
            ctx.element.innerHTML = '';
          }
        } else {
          const fragment = range.extractContents();
          const wrapper = document.createElement('div');
          wrapper.appendChild(fragment);
          // Bug fix #7: Strip inline formatting from extracted content
          // (same as Angular's stripInlineFormatting)
          text = extractTextWithNewlines(wrapper);
        }
      }

      if (!text) text = '\u200B';

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = text;
      pre.appendChild(code);

      if (insertAnchor) {
        // Insert at the exact position the list/blockquote occupied
        insertAnchor.parent.insertBefore(pre, insertAnchor.before);
      } else {
        // Insert at cursor
        const freshRange = sel.rangeCount > 0 ? sel.getRangeAt(0) : range;
        freshRange.insertNode(pre);
      }

      // Strip inline formatting ancestors (b, i, u, s, etc.) wrapping the <pre>.
      // Code block should override all inline formatting — same as Angular's stripInlineAncestors.
      const inlineTags = new Set(['B', 'I', 'U', 'S', 'STRONG', 'EM', 'DEL', 'STRIKE', 'CODE']);
      let ancestor = pre.parentElement;
      while (ancestor && ancestor !== ctx.element) {
        const nextAncestor = ancestor.parentElement;
        if (inlineTags.has(ancestor.tagName)) {
          const parent = ancestor.parentNode;
          if (parent) {
            while (ancestor.firstChild) parent.insertBefore(ancestor.firstChild, ancestor);
            parent.removeChild(ancestor);
          }
        }
        ancestor = nextAncestor;
      }

      const newRange = document.createRange();
      newRange.selectNodeContents(code);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    ctx.markFormattingApplied();
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return ctx.hasAncestor(node, 'PRE');
  },
};
