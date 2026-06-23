import type { ReactNode } from 'react';
import type { CometChat, FlagReason } from '@cometchat/chat-sdk-javascript';

/** Props for CometChatFlagMessageDialog.Root */
export interface CometChatFlagMessageDialogRootProps {
  /** The message being flagged. Required for SDK submission. */
  message: CometChat.BaseMessage;
  /** Whether the dialog is currently open. When provided, the component is controlled. */
  isOpen?: boolean;
  /** Callback invoked when the dialog requests to close (outside click, Escape, cancel). */
  onClose?: () => void;
  /** Whether the dialog closes when clicking outside it. Defaults to true. */
  closeOnOutsideClick?: boolean;
  /** Custom submit handler. If omitted, uses the default SDK flagMessage call. */
  onSubmit?: (messageId: string, reasonId: string, remark?: string) => Promise<boolean>;
  /** Error callback for SDK errors. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Children (Header, Reasons, Remark, Actions sub-components). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFlagMessageDialog.Header */
export interface CometChatFlagMessageDialogHeaderProps {
  /** Title text. Defaults to localized "Report a Message". */
  title?: string;
  /** Subtitle text. Defaults to localized description. */
  subtitle?: string;
  /** Children for fully custom header content. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFlagMessageDialog.Reasons */
export interface CometChatFlagMessageDialogReasonsProps {
  /** Children for fully custom reason rendering (overrides default reason list). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFlagMessageDialog.Remark */
export interface CometChatFlagMessageDialogRemarkProps {
  /** Placeholder text. Defaults to localized placeholder. */
  placeholder?: string;
  /** Maximum character count. Defaults to 500. */
  maxLength?: number;
  /** Label text. Defaults to localized "Reason". */
  label?: string;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFlagMessageDialog.Actions */
export interface CometChatFlagMessageDialogActionsProps {
  /** Text for the cancel button. Defaults to localized "Cancel". */
  cancelText?: string;
  /** Text for the submit/report button. Defaults to localized "Report". */
  submitText?: string;
  /** Children for fully custom action buttons. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value for CometChatFlagMessageDialog */
export interface CometChatFlagMessageDialogContextValue {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Request to close the dialog. */
  onClose: () => void;
  /** The message being flagged. */
  message: CometChat.BaseMessage;
  /** Available flag reasons (fetched from SDK). */
  flagReasons: FlagReason[];
  /** Currently selected reason, or null. */
  selectedReason: FlagReason | null;
  /** Select a flag reason. */
  selectReason: (reason: FlagReason) => void;
  /** Current remark text. */
  remark: string;
  /** Update the remark text. */
  setRemark: (value: string) => void;
  /** Current error message, or empty string. */
  errorMessage: string;
  /** Set error message. */
  setErrorMessage: (msg: string) => void;
  /** Whether a submit is in progress. */
  isLoading: boolean;
  /** Submit the flag report. */
  handleSubmit: () => Promise<void>;
  /** Whether reasons are still loading from SDK. */
  isLoadingReasons: boolean;
}
