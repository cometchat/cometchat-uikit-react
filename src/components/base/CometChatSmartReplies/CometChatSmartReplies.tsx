import { CometChatSmartRepliesRoot } from './CometChatSmartRepliesRoot';
import { CometChatSmartRepliesHeader } from './CometChatSmartRepliesHeader';
import { CometChatSmartRepliesItem } from './CometChatSmartRepliesItem';
import { CometChatSmartRepliesLoading } from './CometChatSmartRepliesLoading';
import { CometChatSmartRepliesError } from './CometChatSmartRepliesError';
import { CometChatSmartRepliesEmpty } from './CometChatSmartRepliesEmpty';

/**
 * CometChatSmartReplies — compound component for AI-powered reply suggestions.
 *
 * Usage:
 * ```tsx
 * <CometChatSmartReplies.Root getSmartReplies={fetchReplies} onSuggestionClick={handleReply} onClose={handleClose}>
 *   <CometChatSmartReplies.Header />
 *   <CometChatSmartReplies.Loading />
 *   <CometChatSmartReplies.Error />
 *   <CometChatSmartReplies.Empty />
 * </CometChatSmartReplies.Root>
 * ```
 */
export const CometChatSmartReplies = {
  Root: CometChatSmartRepliesRoot,
  Header: CometChatSmartRepliesHeader,
  Item: CometChatSmartRepliesItem,
  Loading: CometChatSmartRepliesLoading,
  Error: CometChatSmartRepliesError,
  Empty: CometChatSmartRepliesEmpty,
} as const;
