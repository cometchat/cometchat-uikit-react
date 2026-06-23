/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * LinkFormat — handles creating, editing, and removing hyperlinks.
 *
 * Uses ctx.execCommand('createLink') and 'unlink' under the hood,
 * plus manual attribute setting for target="_blank" and rel.
 */

import type { EditorContext, FormatCommand } from './format.types';
import { deactivateUnderline } from './InlineFormat';

/**
 * Set or remove a link on the current selection.
 * @param url - The URL to link to. Pass null to remove the link.
 * @param text - Optional display text. If provided and different from selection, replaces it.
 * @param ctx - Editor context.
 */
export function setLink(url: string | null, ctx: EditorContext, text?: string): void {
  const sel = ctx.getWindow().getSelection();
  if (!sel || sel.rangeCount === 0) return;

  if (url === null) {
    // Remove link — select the entire anchor first, then unlink
    const range = sel.getRangeAt(0);
    const anchor = ctx.findAncestor(range.startContainer, 'A') as HTMLAnchorElement | null;
    if (anchor) {
      const selectRange = ctx.getDocument().createRange();
      selectRange.selectNodeContents(anchor);
      sel.removeAllRanges();
      sel.addRange(selectRange);
      ctx.execCommand('unlink');
    } else {
      ctx.execCommand('unlink');
    }
  } else {
    const range = sel.getRangeAt(0);
    // Check if cursor/selection is inside an existing <a> — edit mode
    const existingAnchor = ctx.findAncestor(range.startContainer, 'A') as HTMLAnchorElement | null;

    if (existingAnchor) {
      // Edit mode: update the existing anchor in place
      existingAnchor.href = url;
      if (text && text !== existingAnchor.textContent) {
        existingAnchor.textContent = text;
      }
      existingAnchor.setAttribute('target', '_blank');
      existingAnchor.setAttribute('rel', 'noopener noreferrer');
      // Place cursor after the anchor
      const newRange = ctx.getDocument().createRange();
      newRange.setStartAfter(existingAnchor);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      // Add mode: create a new link
      // Check if underline was active BEFORE creating the link
      const wasUnderlineActive = ctx.getDocument().queryCommandState('underline');

      if (text && sel.toString() !== text) {
        ctx.execCommand('insertText', text);
        const r = sel.getRangeAt(0);
        r.setStart(r.startContainer, r.startOffset - text.length);
      }
      ctx.execCommand('createLink', url);
      const anchor = ctx.findAncestor(sel.anchorNode, 'A') as HTMLAnchorElement | null;
      if (anchor) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');

        // Place cursor AFTER the anchor with a zero-width space so the cursor
        // is outside the link and the browser's underline state is reset.
        const zws = ctx.getDocument().createTextNode('\u200B');
        anchor.parentNode?.insertBefore(zws, anchor.nextSibling);
        const newRange = ctx.getDocument().createRange();
        newRange.setStart(zws, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }

      // If underline was NOT active before creating the link, turn it off now.
      // execCommand('createLink') can arm underline as a side effect in some browsers.
      if (!wasUnderlineActive && ctx.getDocument().queryCommandState('underline')) {
        ctx.execCommand('underline');
      }
      // Also explicitly deactivate underline in the override set so the toolbar
      // doesn't show it as active even if queryCommandState still returns true.
      deactivateUnderline();
    }
  }

  ctx.markFormattingApplied();
  ctx.updateFormatState();
  ctx.pushHistory();
  ctx.emitUpdate();
}

/** Get the URL of the link at the current cursor position. */
export function getCurrentLink(ctx: EditorContext): string | null {
  const sel = ctx.getWindow().getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const anchor = ctx.findAncestor(sel.anchorNode, 'A') as HTMLAnchorElement | null;
  return anchor?.href ?? null;
}

/** Get the text of the link at the current cursor position. */
export function getCurrentLinkText(ctx: EditorContext): string | null {
  const sel = ctx.getWindow().getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const anchor = ctx.findAncestor(sel.anchorNode, 'A') as HTMLAnchorElement | null;
  return anchor?.textContent ?? null;
}

// ==================== Format Command Implementation ====================

export const LinkFormat: FormatCommand = {
  id: 'link',
  name: 'Link',

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute(_ctx: EditorContext): void {
    // Link is special — it requires a URL parameter, so execute is a no-op.
    // Use setLink() directly instead.
    // This exists so the format can participate in the registry for isActive checks.
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return ctx.hasAncestor(node, 'A');
  },
};
