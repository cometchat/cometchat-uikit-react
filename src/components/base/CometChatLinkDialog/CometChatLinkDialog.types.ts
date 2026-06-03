import type { HTMLAttributes } from 'react';

/** Data emitted on save action. */
export interface CometChatLinkDialogData {
  /** The link display text. */
  text: string;
  /** The normalized link URL (with protocol). */
  url: string;
}

/** Props for CometChatLinkDialog. */
export interface CometChatLinkDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Dialog mode.
   * - `'add'`: empty fields, text required, title "Add Link"
   * - `'edit'`: pre-filled fields, title "Edit Link", Save disabled until changes made
   * @default 'add'
   */
  mode?: 'add' | 'edit';
  /** Initial text value (for edit mode or pre-filled add mode). */
  initialText?: string;
  /** Initial URL value (for edit mode). */
  initialUrl?: string;
  /** Selected text from editor (used as default text in add mode). */
  selectedText?: string;
  /** Callback when Save is clicked with valid data. Receives { text, url }. */
  onSave: (data: CometChatLinkDialogData) => void;
  /** Callback when Cancel is clicked or Escape is pressed. */
  onCancel: () => void;
  /** Optional custom className. */
  className?: string;
}
