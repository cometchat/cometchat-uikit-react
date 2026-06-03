import type { ReactNode } from 'react';

/** Props for CometChatThreadViewRoot. */
export interface CometChatThreadViewRootProps {
  /** Number of replies in the thread. Component renders nothing when 0. */
  replyCount: number;
  /** Number of unread replies. Shows an unread indicator dot when > 0. */
  unreadReplyCount?: number | undefined;
  /** Callback when the thread view is clicked to open the thread. */
  onClick?: (() => void) | undefined;
  /** Alignment of the thread view (affects text/icon justification). */
  alignment?: 'left' | 'right' | undefined;
  /** Children (ReplyCount, Icon, UnreadIndicator, or custom content). */
  children?: ReactNode | undefined;
  /** Optional custom className for the root container. */
  className?: string | undefined;
}

/** Props for CometChatThreadViewReplyCount. */
export interface CometChatThreadViewReplyCountProps {
  /** Override the default formatted text (e.g., "3 Replies"). */
  text?: string | undefined;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatThreadViewIcon. */
export interface CometChatThreadViewIconProps {
  /** Custom icon URL (SVG). Falls back to default reply-in-thread icon. */
  iconURL?: string | undefined;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatThreadViewUnreadIndicator. */
export interface CometChatThreadViewUnreadIndicatorProps {
  /** Optional custom className. */
  className?: string | undefined;
}

/** Context value shared between CometChatThreadView sub-components. */
export interface CometChatThreadViewContextValue {
  /** Number of replies. */
  replyCount: number;
  /** Number of unread replies. */
  unreadReplyCount: number;
  /** Click handler to open thread. */
  onClick?: (() => void) | undefined;
  /** Alignment. */
  alignment: 'left' | 'right';
}
