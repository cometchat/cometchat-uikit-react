import type { HTMLAttributes } from 'react';

/** Props for CometChatToast. */
export interface CometChatToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The message text to display in the toast. Renders nothing when empty. */
  text: string;
  /**
   * Duration in milliseconds before auto-dismiss.
   * - Default: `3000`
   * - Set to `0` to disable auto-dismiss (toast persists until dismissed manually or unmounted by parent).
   */
  duration?: number;
  /** Callback fired when the toast is dismissed (auto-dismiss, close button, or Escape key). */
  onClose?: () => void;
  /** Whether to show the close button for manual dismissal. Default: `true`. */
  showCloseButton?: boolean;
  /** Whether pressing Escape dismisses the toast. Default: `true`. */
  dismissOnEscape?: boolean;
  /** Optional custom className. */
  className?: string;
}
