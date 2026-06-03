import { CometChatConversationStarterRoot } from './CometChatConversationStarterRoot';
import { CometChatConversationStarterItem } from './CometChatConversationStarterItem';
import { CometChatConversationStarterLoading } from './CometChatConversationStarterLoading';
import { CometChatConversationStarterError } from './CometChatConversationStarterError';
import { CometChatConversationStarterEmpty } from './CometChatConversationStarterEmpty';

/**
 * CometChatConversationStarter — compound component for AI-generated conversation starters.
 *
 * Usage:
 * ```tsx
 * <CometChatConversationStarter.Root getConversationStarters={fetchStarters} onSuggestionClick={handleClick}>
 *   <CometChatConversationStarter.Loading />
 *   <CometChatConversationStarter.Error />
 *   <CometChatConversationStarter.Empty />
 * </CometChatConversationStarter.Root>
 * ```
 */
export const CometChatConversationStarter = {
  Root: CometChatConversationStarterRoot,
  Item: CometChatConversationStarterItem,
  Loading: CometChatConversationStarterLoading,
  Error: CometChatConversationStarterError,
  Empty: CometChatConversationStarterEmpty,
} as const;
