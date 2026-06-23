/**
 * Rich Text Editor Types
 *
 * Type definitions for the custom rich text editor.
 */

/** Tracks which formatting options are currently active at the caret position. */
export interface CometChatRichTextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  orderedList: boolean;
  bulletList: boolean;
  link: boolean;
}

/** Configuration options for creating a RichTextEditor instance. */
export interface CometChatRichTextEditorConfig {
  /** Placeholder text when editor is empty. */
  placeholder?: string;
  /** Whether the editor should be editable. Default: true. */
  editable?: boolean;
  /** Whether to autofocus the editor on creation. */
  autofocus?: boolean | 'start' | 'end';
  /** Initial HTML content. */
  content?: string;
  /** ARIA label for accessibility. Default: 'Rich text editor'. */
  ariaLabel?: string;
  /** Whether to enable rich text formatting. When false, strips formatting on paste. Default: true. */
  enableFormatting?: boolean;
  /**
   * The document to use for DOM operations (createElement, createRange, execCommand, etc.).
   * Defaults to the global `document`. Provide the iframe's contentDocument when rendering
   * inside an iframe via CometChatFrameProvider.
   */
  ownerDocument?: Document;
  /**
   * The window to use for selection APIs (getSelection, etc.).
   * Defaults to the global `window`. Provide the iframe's contentWindow when rendering
   * inside an iframe via CometChatFrameProvider.
   */
  ownerWindow?: Window;
  /** Called when editor content changes. */
  onUpdate?: (html: string, text: string) => void;
  /** Called when selection changes (format state updates). */
  onSelectionUpdate?: (formatState: CometChatRichTextFormatState) => void;
  /** Called when editor is focused. */
  onFocus?: () => void;
  /** Called when editor loses focus. */
  onBlur?: () => void;
  /** Called when a link is clicked for editing. */
  onLinkClick?: (url: string, text: string, x: number, y: number) => void;
  /** Called when @ is typed to trigger mention suggestions. */
  onMentionStart?: (query: string) => void;
  /** Called when mention suggestions should be hidden. */
  onMentionEnd?: () => void;
  /**
   * Called when Enter is pressed without Shift.
   * If provided, the editor will preventDefault and call this instead of inserting a newline.
   * Shift+Enter always inserts a newline regardless.
   */
  onEnterPress?: () => void;
  /**
   * Keyboard event interceptor. Called before the editor processes any keydown.
   * Return `true` to indicate the event was handled (editor skips its own handling).
   */
  onKeyDown?: (e: KeyboardEvent) => boolean;
}

/** History entry for undo/redo. */
export interface CometChatHistoryEntry {
  html: string;
  cursorPosition: number;
  timestamp: number;
}

/** Default (empty) format state. */
export const DEFAULT_FORMAT_STATE: CometChatRichTextFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  blockquote: false,
  codeBlock: false,
  orderedList: false,
  bulletList: false,
  link: false,
};
