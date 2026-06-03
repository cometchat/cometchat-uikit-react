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
  /** Optional className. */
  className?: string;
}
