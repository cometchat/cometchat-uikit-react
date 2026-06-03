import type { ReactNode } from 'react';

/** Variant of the confirm dialog — affects icon and confirm button styling. */
export type CometChatConfirmDialogVariant = 'danger' | 'warning' | 'info';

/** Props for CometChatConfirmDialog.Root. */
export interface CometChatConfirmDialogRootProps {
  /** Whether the dialog is currently open. When provided, the component is controlled. */
  isOpen?: boolean;
  /** Callback invoked when the dialog requests to close (outside click, Escape, cancel button). */
  onClose?: () => void;
  /** Whether the dialog closes when clicking outside it. Defaults to true. */
  closeOnOutsideClick?: boolean;
  /** Visual variant affecting icon and confirm button color. Defaults to 'danger'. */
  variant?: CometChatConfirmDialogVariant;
  /** Children (Icon, Content, Actions sub-components). */
  children: ReactNode;
  /** Optional custom className for the root container. */
  className?: string;
}

/** Props for CometChatConfirmDialog.Icon. */
export interface CometChatConfirmDialogIconProps {
  /** Custom icon element. If omitted, renders a default icon based on the variant. */
  icon?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatConfirmDialog.Content. */
export interface CometChatConfirmDialogContentProps {
  /** Title text displayed in the dialog. */
  title?: string;
  /** Descriptive message text. */
  messageText?: string;
  /** Children for fully custom content (overrides title + messageText). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatConfirmDialog.Actions. */
export interface CometChatConfirmDialogActionsProps {
  /** Text for the cancel button. Defaults to localized "Cancel". */
  cancelButtonText?: string;
  /** Text for the confirm button. Defaults to localized "Confirm". */
  confirmButtonText?: string;
  /** Callback when confirm button is clicked. Can return a Promise for async operations. */
  onConfirm?: () => void | Promise<void>;
  /** Callback when cancel button is clicked. Defaults to calling onClose from context. */
  onCancel?: () => void;
  /** Whether the confirm button is in a loading state. When onConfirm returns a Promise, this is managed automatically. */
  isLoading?: boolean;
  /** Error message to display above the buttons. When onConfirm rejects, this is set automatically. */
  errorText?: string;
  /** Children for fully custom action buttons (overrides default cancel/confirm). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value for CometChatConfirmDialog. */
export interface CometChatConfirmDialogContextValue {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Request to close the dialog. */
  onClose: () => void;
  /** Current variant. */
  variant: CometChatConfirmDialogVariant;
}
