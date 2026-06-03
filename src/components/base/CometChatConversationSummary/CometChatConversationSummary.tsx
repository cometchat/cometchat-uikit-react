import { CometChatConversationSummaryRoot } from './CometChatConversationSummaryRoot';
import { CometChatConversationSummaryHeader } from './CometChatConversationSummaryHeader';
import { CometChatConversationSummaryBody } from './CometChatConversationSummaryBody';
import { CometChatConversationSummaryLoading } from './CometChatConversationSummaryLoading';
import { CometChatConversationSummaryError } from './CometChatConversationSummaryError';
import { CometChatConversationSummaryEmpty } from './CometChatConversationSummaryEmpty';

/**
 * CometChatConversationSummary — compound component for AI-generated conversation summaries.
 *
 * Usage:
 * ```tsx
 * <CometChatConversationSummary.Root getConversationSummary={fetchSummary} onClose={handleClose}>
 *   <CometChatConversationSummary.Header />
 *   <CometChatConversationSummary.Loading />
 *   <CometChatConversationSummary.Error />
 *   <CometChatConversationSummary.Empty />
 *   <CometChatConversationSummary.Body />
 * </CometChatConversationSummary.Root>
 * ```
 */
export const CometChatConversationSummary = {
  Root: CometChatConversationSummaryRoot,
  Header: CometChatConversationSummaryHeader,
  Body: CometChatConversationSummaryBody,
  Loading: CometChatConversationSummaryLoading,
  Error: CometChatConversationSummaryError,
  Empty: CometChatConversationSummaryEmpty,
} as const;
