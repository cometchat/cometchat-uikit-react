/**
 * BlockquoteFormat — wraps/unwraps content in <blockquote>.
 *
 * Mutual exclusion: applying blockquote atomically removes any active
 * code block by capturing its text, removing the <pre>, then inserting
 * the <blockquote> at the same DOM position — no intermediate <p> elements.
 */

import type { EditorContext, FormatCommand } from './format.types';

export const BlockquoteFormat: FormatCommand = {
  id: 'blockquote',
  name: 'Blockquote',

  execute(ctx: EditorContext): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    // --- Toggle off: already inside a blockquote ---
    const existingBq = ctx.findAncestor(range.startContainer, 'BLOCKQUOTE') as HTMLElement | null;
    if (existingBq) {
      const parent = existingBq.parentNode;
      if (!parent) return;
      while (existingBq.firstChild) {
        parent.insertBefore(existingBq.firstChild, existingBq);
      }
      existingBq.remove();
      ctx.markFormattingApplied();
      ctx.updateFormatState();
      ctx.pushHistory();
      ctx.emitUpdate();
      return;
    }

    // --- Wrap ---
    // Check for active code block — capture text + position, remove it atomically,
    // then insert the blockquote at the same position.
    const preEl = (ctx.findAncestor(range.startContainer, 'PRE') ??
      ctx.element.querySelector('pre')) as HTMLElement | null;

    const bq = document.createElement('blockquote');

    if (preEl) {
      const text = (preEl.textContent ?? '').replace(/\u200B/g, '');
      const insertParent = preEl.parentNode;
      if (!insertParent) return;
      const insertBefore = preEl.nextSibling;
      preEl.remove();

      // Put each line of the code block as a <p> inside the blockquote
      const lines = text ? text.split('\n') : [''];
      for (const line of lines) {
        const p = document.createElement('p');
        p.style.margin = '0';
        p.textContent = line || '\u200B';
        bq.appendChild(p);
      }
      insertParent.insertBefore(bq, insertBefore);
    } else {
      // No code block — wrap the current top-level block
      const blockToWrap = findTopLevelBlock(range.startContainer, ctx);
      if (blockToWrap) {
        blockToWrap.parentNode?.insertBefore(bq, blockToWrap);
        bq.appendChild(blockToWrap);
      } else {
        bq.innerHTML = '<br>';
        range.insertNode(bq);
      }
    }

    // Place cursor inside the blockquote
    const newRange = document.createRange();
    newRange.selectNodeContents(bq);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);

    ctx.markFormattingApplied();
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return ctx.hasAncestor(node, 'BLOCKQUOTE');
  },
};

function findTopLevelBlock(node: Node, ctx: EditorContext): HTMLElement | null {
  let current: Node | null = node;
  let candidate: HTMLElement | null = null;

  while (current && current !== ctx.element) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      const tag = el.tagName;
      if ((tag === 'OL' || tag === 'UL') && el.parentElement === ctx.element) {
        return el;
      }
      if (el.parentElement === ctx.element) {
        candidate = el;
      }
    }
    current = current.parentNode;
  }

  return candidate;
}
