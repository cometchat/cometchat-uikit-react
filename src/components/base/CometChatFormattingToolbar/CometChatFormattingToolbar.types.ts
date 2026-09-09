import type { ReactNode } from 'react';
import type { CometChatRichTextFormatState } from '../../../utils/RichTextEditor/RichTextEditor.types';

/** Props for CometChatFormattingToolbar. */
export interface CometChatFormattingToolbarProps {
  /** Current format state — determines which buttons appear active. */
  formatState: CometChatRichTextFormatState;
  /** Whether inline formatting (bold/italic/underline/strikethrough) is disabled (e.g., inside code block). */
  inlineFormattingDisabled?: boolean;
  /** Callbacks for each formatting action. */
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrikethrough: () => void;
  onInlineCode: () => void;
  onCodeBlock: () => void;
  onBlockquote: () => void;
  onOrderedList: () => void;
  onBulletList: () => void;
  onLink: () => void;
  /**
   * Custom content rendered after the built-in buttons, inside the same toolbar row (preceded by a
   * separator). Drives the composer's `toolbarTrailingView` prop — e.g. a view wrapping one or more
   * buttons that apply custom formats via their formatter. Inherits the toolbar's
   * mousedown-preventDefault, so the editor selection is preserved when clicked.
   */
  trailingContent?: ReactNode;
  /** Optional className. */
  className?: string;
}
