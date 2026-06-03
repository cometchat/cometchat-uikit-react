/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * InlineFormat — handles bold, italic, underline, and strikethrough.
 *
 * These are simple execCommand-based formats that share identical logic.
 * They use document.execCommand under the hood and track armed/deactivated
 * state for edge cases where queryCommandState is unreliable.
 */

import type { EditorContext, FormatCommand } from './format.types';

/**
 * Tracks inline formats that have been toggled OFF while the cursor is inside
 * existing formatted content. queryCommandState still returns true, but the
 * format has been deactivated for future typing.
 */
const deactivatedFormats = new Set<string>();

/**
 * Tracks inline formats that have been toggled ON while the cursor is in
 * unformatted content. queryCommandState may not report them yet.
 */
const activatedFormats = new Set<string>();

/** Clear all pending overrides (called on input or cursor move). */
export function clearInlineOverrides(): void {
  deactivatedFormats.clear();
  activatedFormats.clear();
}

/** Explicitly deactivate underline (used after link creation to suppress false positive). */
export function deactivateUnderline(): void {
  deactivatedFormats.add('underline');
  activatedFormats.delete('underline');
}

/** Check if a format has been manually deactivated. */
export function isDeactivated(command: string): boolean {
  return deactivatedFormats.has(command);
}

/** Check if a format has been manually activated. */
export function isActivated(command: string): boolean {
  return activatedFormats.has(command);
}

/**
 * Execute an inline format command with state tracking.
 *
 * Handles the edge case where queryCommandState can't report the toggle
 * (cursor inside existing formatted content — both before/after return true).
 */
function execInlineFormat(command: string, ctx: EditorContext): void {
  let stateBefore = false;
  try {
    stateBefore = document.queryCommandState(command);
  } catch {
    // ignore
  }

  // Suppress selection change BEFORE focus to prevent clearing armed overrides.
  // ctx.focus() can trigger selectionchange which would wipe formats armed by
  // previous toolbar clicks (e.g., bold armed, then underline clicked).
  ctx.markFormattingApplied();
  ctx.focus();
  document.execCommand(command, false);

  let stateAfter = false;
  try {
    stateAfter = document.queryCommandState(command);
  } catch {
    // ignore
  }

  // Track pending format overrides for the rare case where queryCommandState
  // can't report the toggle.
  if (stateBefore && stateAfter) {
    // Was true before, still reports true after → user toggled it OFF
    deactivatedFormats.add(command);
    activatedFormats.delete(command);
  } else if (!stateBefore && !stateAfter) {
    // Was false, still false → toggled ON but queryCommandState can't report it
    activatedFormats.add(command);
    deactivatedFormats.delete(command);
  } else {
    // Normal case: queryCommandState changed, it's reliable
    deactivatedFormats.delete(command);
    activatedFormats.delete(command);
  }

  ctx.updateFormatState();
  ctx.pushHistory();
  ctx.emitUpdate();
}

/**
 * Query the active state for an inline format.
 *
 * Priority: manual overrides > queryCommandState > DOM ancestor fallback.
 */
export function queryInlineFormatState(
  command: string,
  node: Node,
  tags: string[],
  ctx: EditorContext
): boolean {
  if (deactivatedFormats.has(command)) return false;
  if (activatedFormats.has(command)) return true;

  try {
    return document.queryCommandState(command);
  } catch {
    // Only use DOM fallback if queryCommandState throws
    return tags.some(tag => ctx.hasAncestor(node, tag));
  }
}

// ==================== Format Command Implementations ====================

export const BoldFormat: FormatCommand = {
  id: 'bold',
  name: 'Bold',

  execute(ctx: EditorContext): void {
    execInlineFormat('bold', ctx);
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return queryInlineFormatState('bold', node, ['STRONG', 'B'], ctx);
  },
};

export const ItalicFormat: FormatCommand = {
  id: 'italic',
  name: 'Italic',

  execute(ctx: EditorContext): void {
    execInlineFormat('italic', ctx);
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return queryInlineFormatState('italic', node, ['EM', 'I'], ctx);
  },
};

export const UnderlineFormat: FormatCommand = {
  id: 'underline',
  name: 'Underline',

  execute(ctx: EditorContext): void {
    execInlineFormat('underline', ctx);
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return queryInlineFormatState('underline', node, ['U'], ctx);
  },
};

export const StrikethroughFormat: FormatCommand = {
  id: 'strikethrough',
  name: 'Strikethrough',

  execute(ctx: EditorContext): void {
    execInlineFormat('strikeThrough', ctx);
  },

  isActive(node: Node, ctx: EditorContext): boolean {
    return queryInlineFormatState('strikeThrough', node, ['S', 'STRIKE'], ctx);
  },
};
