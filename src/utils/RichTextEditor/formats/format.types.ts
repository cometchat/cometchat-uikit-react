/**
 * Format Command Interface
 *
 * Every formatting operation (bold, italic, code block, list, etc.)
 * implements this interface. The RichTextEditor orchestrator delegates
 * formatting to these modules.
 */

/**
 * Minimal context the editor exposes to format commands.
 * This avoids circular dependencies — formats don't import the full editor.
 */
export interface EditorContext {
  /** The contenteditable root element. */
  readonly element: HTMLDivElement;

  /** Focus the editor element. */
  focus(): void;

  /** Execute a native document.execCommand. */
  execCommand(command: string, value?: string): void;

  /** Get the owner document (iframe-aware). Falls back to global document. */
  getDocument(): Document;

  /** Get the owner window (iframe-aware). Falls back to global window. */
  getWindow(): Window;

  /** Find the nearest ancestor with the given tag name. Returns null if not found. */
  findAncestor(node: Node | null, tagName: string): Node | null;

  /** Check if a node has an ancestor with the given tag name. */
  hasAncestor(node: Node | null, tagName: string): boolean;

  /** Mark that formatting was just applied (suppresses redundant input handling). */
  markFormattingApplied(): void;

  /** Push current state to undo history. */
  pushHistory(): void;

  /** Emit content update to listeners. */
  emitUpdate(): void;

  /** Update the format state after a change. */
  updateFormatState(): void;
}

/**
 * A format command that can be executed (toggled) and queried for active state.
 */
export interface FormatCommand {
  /** Unique identifier (e.g., 'bold', 'italic', 'codeBlock'). */
  readonly id: string;

  /** Human-readable name for debugging/logging. */
  readonly name: string;

  /** Execute (toggle) this format on the current selection. */
  execute(ctx: EditorContext): void;

  /**
   * Check if this format is currently active at the caret position.
   * @param node - The current anchor node from the selection.
   * @param ctx - Editor context for DOM queries.
   */
  isActive(node: Node, ctx: EditorContext): boolean;
}
