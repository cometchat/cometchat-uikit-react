import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters';

/** Fetch lifecycle state. */
export type CometChatMessageInformationFetchState =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'error'
  | 'empty';

/** Combined user receipt information (for group messages). */
export interface CometChatUserReceiptInfo {
  /** The user who received/read the message. */
  user: CometChat.User;
  /** Timestamp when the message was read (Unix seconds), 0 if not read. */
  readAt: number;
  /** Timestamp when the message was delivered (Unix seconds), 0 if not delivered. */
  deliveredAt: number;
}

/**
 * CalendarObject for date formatting.
 * Matches the pattern used by CometChatDate.
 */
export interface CometChatMessageInformationCalendarObject {
  today?: string;
  yesterday?: string;
  otherDays?: string;
  [key: string]: string | undefined;
}

// --- Root ---

/** Props for CometChatMessageInformation.Root. */
export interface CometChatMessageInformationRootProps {
  /** The message to show information for. Required. */
  message: CometChat.BaseMessage;
  /** Callback when the panel close button is clicked. */
  onClose?: () => void;
  /** Error callback for SDK failures. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Date format for receipt timestamps (read/delivered). */
  messageInfoDateTimeFormat?: CometChatMessageInformationCalendarObject;
  /** Format for the sent-at timestamp on the message bubble preview. */
  messageSentAtDateTimeFormat?: CometChatMessageInformationCalendarObject;
  /** Text formatters for the message bubble preview. */
  textFormatters?: CometChatTextFormatter[];
  /** Whether to show the scrollbar in the content area. Default: false. */
  showScrollbar?: boolean;
  /** Children (sub-components). When omitted, renders default layout. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

// --- Header ---

/** Props for CometChatMessageInformation.Header. */
export interface CometChatMessageInformationHeaderProps {
  /** Optional custom className. */
  className?: string;
}

// --- MessagePreview ---

/** Props for CometChatMessageInformation.MessagePreview. */
export interface CometChatMessageInformationMessagePreviewProps {
  /** Optional custom className. */
  className?: string;
}

// --- ReceiptList ---

/** Props for CometChatMessageInformation.ReceiptList. */
export interface CometChatMessageInformationReceiptListProps {
  /** Optional custom className. */
  className?: string;
}

// --- LoadingState ---

/** Props for CometChatMessageInformation.LoadingState. */
export interface CometChatMessageInformationLoadingStateProps {
  /** Optional custom className. */
  className?: string;
}

// --- ErrorState ---

/** Props for CometChatMessageInformation.ErrorState. */
export interface CometChatMessageInformationErrorStateProps {
  /** Optional custom className. */
  className?: string;
}

// --- EmptyState ---

/** Props for CometChatMessageInformation.EmptyState. */
export interface CometChatMessageInformationEmptyStateProps {
  /** Optional custom className. */
  className?: string;
}

// --- Context ---

/** Context value shared across CometChatMessageInformation sub-components. */
export interface CometChatMessageInformationContextValue {
  /** The message object. */
  message: CometChat.BaseMessage;
  /** Fetch lifecycle state. */
  fetchState: CometChatMessageInformationFetchState;
  /** User receipts for group messages. */
  userReceipts: CometChatUserReceiptInfo[];
  /** Read timestamp for 1-on-1 messages (Unix seconds). */
  oneOnOneReadAt: number;
  /** Delivered timestamp for 1-on-1 messages (Unix seconds). */
  oneOnOneDeliveredAt: number;
  /** Error message, if any. */
  error: string | null;
  /** Whether this is a group message. */
  isGroupMessage: boolean;
  /** Date format for receipt timestamps. */
  messageInfoDateTimeFormat: CometChatMessageInformationCalendarObject;
  /** Format for the sent-at timestamp on the message bubble preview. */
  messageSentAtDateTimeFormat?: CometChatMessageInformationCalendarObject;
  /** Text formatters for the message bubble preview. */
  textFormatters: CometChatTextFormatter[];
  /** Whether to show the scrollbar. */
  showScrollbar: boolean;
  /** Close the panel. */
  onClose: () => void;
  /** Retry fetching receipts after error. */
  retry: () => void;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatMessageInformation />` flat API. */
export interface CometChatMessageInformationConvenienceProps {
  /** Custom header content (replaces default header). */
  headerView?: ReactNode;
  /** Custom receipt list content (replaces default receipt list). */
  receiptListView?: ReactNode;
  /** Custom loading state content (replaces default loading). */
  loadingView?: ReactNode;
  /** Custom error state content (replaces default error view). */
  errorView?: ReactNode;
  /** Custom empty state content (replaces default empty view). */
  emptyView?: ReactNode;
}

/**
 * Props for the direct `<CometChatMessageInformation />` flat API.
 * Combines all Root props with convenience view props.
 */
export type CometChatMessageInformationProps = Omit<
  CometChatMessageInformationRootProps,
  'children'
> &
  CometChatMessageInformationConvenienceProps;
