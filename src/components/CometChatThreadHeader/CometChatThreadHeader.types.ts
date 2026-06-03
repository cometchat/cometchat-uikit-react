import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';

/** Props for CometChatThreadHeaderRoot. */
export interface CometChatThreadHeaderRootProps {
  /** The parent message of the thread. Required. */
  parentMessage: CometChat.BaseMessage;
  /** Whether to hide message receipts in the parent bubble. */
  hideReceipts?: boolean | undefined;
  /** Whether to hide the date chip shown above the parent bubble. @default false */
  hideDate?: boolean | undefined;
  /** Whether to hide the reply count section below the parent bubble. @default false */
  hideReplyCount?: boolean | undefined;
  /** Format for the date chip shown above the parent bubble. */
  separatorDateTimeFormat?: CometChatDateFormatConfig | undefined;
  /** Format for the sent-at timestamp on the parent message bubble. */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig | undefined;
  /** Whether to show the scrollbar on the bubble wrapper area. @default false */
  showScrollbar?: boolean | undefined;
  /** Callback when the close button is clicked or Escape is pressed. */
  onClose?: (() => void) | undefined;
  /** Callback when the sender name / subtitle is clicked (navigate to parent in main list). */
  onSubtitleClicked?: (() => void) | undefined;
  /** Callback when the parent message is deleted (thread should close). */
  onParentDeleted?: (() => void) | undefined;
  /** Error callback for SDK errors. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Optional custom className for the root container. */
  className?: string | undefined;
  /** Children for compound composition. If omitted, renders default layout. */
  children?: ReactNode | undefined;
}

/** Props for CometChatThreadHeaderTopBar. */
export interface CometChatThreadHeaderTopBarProps {
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom content. If omitted, renders default title + sender + close button. */
  children?: ReactNode | undefined;
}

/** Props for CometChatThreadHeaderTitle. */
export interface CometChatThreadHeaderTitleProps {
  /** Custom title text (overrides default localized "Thread"). */
  title?: string | undefined;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatThreadHeaderSenderName. */
export interface CometChatThreadHeaderSenderNameProps {
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatThreadHeaderCloseButton. */
export interface CometChatThreadHeaderCloseButtonProps {
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatThreadHeaderParentBubble. */
export interface CometChatThreadHeaderParentBubbleProps {
  /** Whether interactions on the bubble are disabled. Default: true. */
  disableInteraction?: boolean | undefined;
  /** Format for the sent-at timestamp on the parent message bubble. */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig | undefined;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatThreadHeaderReplyCount. */
export interface CometChatThreadHeaderReplyCountProps {
  /** Whether to show the divider line. Default: true. */
  showDivider?: boolean | undefined;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Context value shared between sub-components. */
export interface CometChatThreadHeaderContextValue {
  /** The parent message (may be updated on edit). */
  parentMessage: CometChat.BaseMessage;
  /** Current reply count (updates in real-time). */
  replyCount: number;
  /** Sender name of the parent message. */
  senderName: string;
  /** Close handler. */
  onClose?: (() => void) | undefined;
  /** Subtitle click handler (navigate to parent in main list). */
  onSubtitleClicked?: (() => void) | undefined;
  /** Whether to hide the date chip above the parent bubble. */
  hideDate?: boolean | undefined;
  /** Whether to hide the reply count section. */
  hideReplyCount?: boolean | undefined;
  /** Format for the date chip above the parent bubble. */
  separatorDateTimeFormat?: CometChatDateFormatConfig | undefined;
  /** Format for the sent-at timestamp on the parent bubble. */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig | undefined;
  /** Whether to show the scrollbar. */
  showScrollbar?: boolean | undefined;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatThreadHeader />` flat API. */
export interface CometChatThreadHeaderConvenienceProps {
  /** Custom header/top bar content (replaces default top bar). */
  headerView?: ReactNode;
  /** Custom parent message bubble view (replaces default bubble rendering). */
  messageBubbleView?: ReactNode;
  /** Custom subtitle view below the title. */
  subtitleView?: ReactNode;
}

/**
 * Props for the direct `<CometChatThreadHeader />` flat API.
 * Combines all Root props with convenience view props.
 */
export type CometChatThreadHeaderProps = Omit<CometChatThreadHeaderRootProps, 'children'> &
  CometChatThreadHeaderConvenienceProps;
