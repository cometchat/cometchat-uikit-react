/**
 * InlineCodeFormat — handles wrapping/unwrapping text in <code> elements.
 *
 * Unlike bold/italic/underline which use execCommand, inline code requires
 * manual DOM manipulation because there's no native execCommand for it.
 *
 * When the selection spans multiple block elements (e.g. list items), each
 * block's text content is wrapped individually so the list structure is
 * preserved.
 */

import type { EditorContext, FormatCommand } from './format.types';

/**
 * Collect all leaf text nodes (and <br> nodes) that are fully or partially
 * covered by `range`, grouped by their closest block ancestor (`<li>`, `<p>`,
 * `<div>`, or the editor root).
 *
 * Returns an array of { block, nodes } pairs in DOM order.
 */
function collectBlockGroups(
  range: Range,
  editorEl: HTMLElement
): { block: Element | HTMLElement; nodes: Node[] }[] {
  const groups: { block: Element | HTMLElement; nodes: Node[] }[] = [];
  const blockTags = new Set([
    'LI',
    'P',
    'DIV',
    'BLOCKQUOTE',
    'PRE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
  ]);

  function getBlock(node: Node): Element | HTMLElement {
    let cur: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (cur && cur !== editorEl) {
      if (cur.nodeType === Node.ELEMENT_NODE && blockTags.has((cur as Element).tagName)) {
        return cur as Element;
      }
      cur = cur.parentNode;
    }
    return editorEl;
  }

  // Walk all nodes inside the range
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
        if (node.nodeType === NodeFilter.SHOW_ELEMENT) {
          const el = node as Element;
          if (el.tagName === 'BR') return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const blockMap = new Map<Element | HTMLElement, Node[]>();
  const blockOrder: (Element | HTMLElement)[] = [];

  let node = walker.nextNode();
  while (node) {
    const block = getBlock(node);
    if (!blockMap.has(block)) {
      blockMap.set(block, []);
      blockOrder.push(block);
    }
    blockMap.get(block)?.push(node);
    node = walker.nextNode();
  }

  for (const block of blockOrder) {
    const nodes = blockMap.get(block);
    if (nodes) groups.push({ block, nodes });
  }

  return groups;
}

/**
 * Wrap a single text node (or a portion of it) in a <code> element.
 * Handles partial selection at the start/end of the range.
 */
function wrapTextInCode(node: Node, range: Range): HTMLElement {
  const code = document.createElement('code');

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text;
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : text.length;

    if (start === 0 && end === text.length) {
      // Whole text node — just wrap it
      node.parentNode?.insertBefore(code, node);
      code.appendChild(node);
    } else {
      // Partial — split the text node
      const before = start > 0 ? text.splitText(start) : text;
      const after = end < before.length ? before.splitText(end - start) : null;
      void after; // keep reference to prevent GC
      node.parentNode?.insertBefore(code, before);
      code.appendChild(before);
    }
  }

  return code;
}

export const InlineCodeFormat: FormatCommand = {
  id: 'inlineCode',
  name: 'Inline Code',

  execute(ctx: EditorContext): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    // --- Toggle OFF: cursor is inside an existing <code> (not in <pre>) ---
    const existingCode = ctx.findAncestor(range.startContainer, 'CODE');
    if (existingCode && !(existingCode as Element).closest('pre')) {
      const text = existingCode.textContent ?? '';
      const textNode = document.createTextNode(text);
      existingCode.parentNode?.replaceChild(textNode, existingCode);
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      ctx.markFormattingApplied();
      ctx.updateFormatState();
      ctx.pushHistory();
      ctx.emitUpdate();
      return;
    }

    // --- Empty selection: insert <code> with ZWS and place cursor inside it ---
    if (range.collapsed) {
      const code = document.createElement('code');
      code.textContent = '\u200B';

      // Ensure the <code> is inserted inside the current inline context, not at the
      // editor root or as a sibling of block elements (which would put it on a new line).
      const container = range.startContainer;
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

      if (container === ctx.element) {
        // Cursor is at the editor root level — find the appropriate block to insert into
        const offset = range.startOffset;
        const childAtOffset = ctx.element.childNodes[offset - 1] ?? ctx.element.lastChild;
        if (childAtOffset?.nodeType === Node.ELEMENT_NODE) {
          const blockEl = childAtOffset as HTMLElement;
          if (blockTags.has(blockEl.tagName) || blockEl.tagName === 'PRE') {
            // Insert at the end of this block element
            blockEl.appendChild(code);
          } else {
            range.insertNode(code);
          }
        } else if (childAtOffset?.nodeType === Node.TEXT_NODE) {
          // Text node at root — insert after it
          childAtOffset.parentNode?.insertBefore(code, childAtOffset.nextSibling);
        } else {
          range.insertNode(code);
        }
      } else {
        range.insertNode(code);
      }

      const newRange = document.createRange();
      if (code.firstChild) {
        newRange.setStart(code.firstChild, 1);
      } else {
        newRange.setStart(code, 0);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      ctx.markFormattingApplied();
      ctx.updateFormatState();
      ctx.pushHistory();
      ctx.emitUpdate();
      return;
    }

    // --- Multi-block selection (e.g. multiple list items): wrap per block ---
    const commonAncestor = range.commonAncestorContainer;
    const isMultiBlock =
      commonAncestor.nodeType === Node.ELEMENT_NODE &&
      (commonAncestor as Element).querySelector('li, p, div, blockquote') !== null;

    if (isMultiBlock) {
      // Collect text nodes grouped by their block container
      const groups = collectBlockGroups(range, ctx.element);
      const lastCode: HTMLElement[] = [];

      for (const { nodes } of groups) {
        for (const node of nodes) {
          if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '') {
            const code = wrapTextInCode(node, range);
            lastCode.push(code);
          }
        }
      }

      // Place cursor after the last inserted <code>
      if (lastCode.length > 0) {
        const last = lastCode[lastCode.length - 1];
        if (last) {
          const newRange = document.createRange();
          newRange.setStartAfter(last);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    } else {
      // --- Single-block selection: wrap the whole selection in one <code> ---
      const code = document.createElement('code');
      try {
        range.surroundContents(code);
      } catch {
        const fragment = range.extractContents();
        code.appendChild(fragment);
        range.insertNode(code);
      }
      const newRange = document.createRange();
      newRange.setStartAfter(code);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    ctx.markFormattingApplied();
    ctx.updateFormatState();
    ctx.pushHistory();
    ctx.emitUpdate();
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return ctx.hasAncestor(node, 'CODE') && !ctx.hasAncestor(node, 'PRE');
  },
};
