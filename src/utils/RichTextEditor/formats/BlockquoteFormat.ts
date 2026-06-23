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
    const sel = ctx.getWindow().getSelection();
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

    const bq = ctx.getDocument().createElement('blockquote');

    if (preEl) {
      const text = (preEl.textContent ?? '').replace(/\u200B/g, '');
      const insertParent = preEl.parentNode;
      if (!insertParent) return;
      const insertBefore = preEl.nextSibling;
      preEl.remove();

      // Put each line of the code block as a <p> inside the blockquote
      const lines = text ? text.split('\n') : [''];
      for (const line of lines) {
        const p = ctx.getDocument().createElement('p');
        p.style.margin = '0';
        p.textContent = line || '\u200B';
        bq.appendChild(p);
      }
      insertParent.insertBefore(bq, insertBefore);
    } else {
      // In that case, wrap ALL selected content in the blockquote, not just one line.
      if (!range.collapsed) {
        // Extract the selected content and wrap it in the blockquote
        const contents = range.extractContents();
        bq.appendChild(contents);
        range.insertNode(bq);
      } else {
        // Find the nearest block-level element that is a direct child of the container
        let blockElement: Node | null = range.startContainer;
        if (blockElement.nodeType === Node.TEXT_NODE) {
          blockElement = blockElement.parentNode;
        }

        // Walk up to find the direct child of the editor element
        while (
          blockElement &&
          blockElement !== ctx.element &&
          blockElement.parentNode !== ctx.element
        ) {
          blockElement = blockElement.parentNode;
        }

        // collect nodes on the current line (bounded by <br> or block elements)
        if (!blockElement || blockElement === ctx.element) {
          const lineNodes = collectCurrentLineNodes(range.startContainer, ctx);

          if (lineNodes.length > 0) {
            // Move collected nodes into the blockquote
            for (const n of lineNodes) {
              bq.appendChild(n.cloneNode(true));
            }
            // Replace original nodes with the blockquote
            ctx.element.insertBefore(bq, lineNodes[0] ?? null);
            for (const n of lineNodes) {
              if (n.parentNode === ctx.element) {
                ctx.element.removeChild(n);
              }
            }
          } else {
            bq.innerHTML = '<br>';
            range.insertNode(bq);
          }
        } else {
          // If it's a list, wrap the whole list
          const tag = (blockElement as HTMLElement).tagName;
          if (tag === 'OL' || tag === 'UL') {
            blockElement.parentNode?.insertBefore(bq, blockElement);
            bq.appendChild(blockElement);
          } else {
            // Wrap just this block element
            blockElement.parentNode?.insertBefore(bq, blockElement);
            bq.appendChild(blockElement);
          }
        }
      }
    }

    // Place cursor inside the blockquote
    const newRange = ctx.getDocument().createRange();
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

/**
 * Collect nodes on the current line (bounded by <br>, block elements, or container edges).
 * Used when content is flat text nodes with <br> separators inside the editor.
 */
function collectCurrentLineNodes(startNode: Node, ctx: EditorContext): Node[] {
  // Resolve to a direct child of the container
  let anchor: Node | null = startNode;
  while (anchor && anchor.parentNode !== ctx.element) {
    anchor = anchor.parentNode;
  }

  if (!anchor || anchor === ctx.element) {
    const sel = ctx.getWindow().getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      let node: Node | null = r.startContainer;
      while (node && node.parentNode !== ctx.element) {
        node = node.parentNode;
      }
      if (node && node !== ctx.element) {
        anchor = node;
      }
    }
    if (!anchor || anchor === ctx.element) {
      return [];
    }
  }

  const isBlockBoundary = (node: Node): boolean => {
    // Element boundaries: BR, DIV, P, etc.
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName;
      return (
        tag === 'BR' ||
        tag === 'DIV' ||
        tag === 'P' ||
        tag === 'PRE' ||
        tag === 'BLOCKQUOTE' ||
        tag === 'OL' ||
        tag === 'UL'
      );
    }
    // Text node containing only newline(s) — acts as a line separator
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      return text === '\n' || text === '\r\n';
    }
    return false;
  };

  // Find start of line (walk backwards from anchor)
  let lineStart: Node | null = anchor;
  let prev: Node | null = lineStart.previousSibling;
  while (prev) {
    if (isBlockBoundary(prev)) break;
    lineStart = prev;
    prev = prev.previousSibling;
  }

  // Collect all nodes from lineStart to end of line
  const lineNodes: Node[] = [];
  let current: Node | null = lineStart;
  while (current) {
    if (isBlockBoundary(current)) break;
    lineNodes.push(current);
    current = current.nextSibling;
  }

  return lineNodes;
}
