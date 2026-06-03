import { CometChatThreadViewRoot } from './CometChatThreadViewRoot';
import { CometChatThreadViewReplyCount } from './CometChatThreadViewReplyCount';
import { CometChatThreadViewIcon } from './CometChatThreadViewIcon';
import { CometChatThreadViewUnreadIndicator } from './CometChatThreadViewUnreadIndicator';

/**
 * CometChatThreadView — compound component for the inline thread reply indicator.
 *
 * Usage:
 * ```tsx
 * <CometChatThreadView.Root replyCount={3} unreadReplyCount={1} onClick={openThread}>
 *   <CometChatThreadView.Icon />
 *   <CometChatThreadView.ReplyCount />
 *   <CometChatThreadView.UnreadIndicator />
 * </CometChatThreadView.Root>
 * ```
 */
export const CometChatThreadView = {
  Root: CometChatThreadViewRoot,
  ReplyCount: CometChatThreadViewReplyCount,
  Icon: CometChatThreadViewIcon,
  UnreadIndicator: CometChatThreadViewUnreadIndicator,
} as const;
