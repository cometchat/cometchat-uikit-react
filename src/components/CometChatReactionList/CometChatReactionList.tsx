import React from 'react';
import { CometChatReactionListRoot } from './CometChatReactionListRoot';
import { CometChatReactionListTabs } from './CometChatReactionListTabs';
import { CometChatReactionListItems } from './CometChatReactionListItems';
import { CometChatReactionListLoadingState } from './CometChatReactionListLoadingState';
import { CometChatReactionListErrorState } from './CometChatReactionListErrorState';
import { CometChatReactionListEmptyState } from './CometChatReactionListEmptyState';
import type { CometChatReactionListRootProps } from './CometChatReactionList.types';

/**
 * Flat API component — renders Root with no children (triggers default layout).
 */
const CometChatReactionListComponent: React.FC<CometChatReactionListRootProps> = props => {
  return <CometChatReactionListRoot {...props} />;
};

/**
 * CometChatReactionList — standalone compound component for viewing who reacted to a message.
 *
 * Shows a panel with emoji tabs (All + per-emoji) and a scrollable list of users who reacted.
 * Fetches reactor details from the SDK via `CometChat.ReactionsRequestBuilder`.
 * Supports clicking own reactions to remove them (fires callback, updates list optimistically).
 * Emits `onEmpty` when all reactions are removed (parent should close the panel).
 *
 * This is a STANDALONE component — it manages its own state and does NOT depend on
 * `CometChatReactions.Root` context. It is distinct from `CometChatReactions.List`
 * which is a sub-component of `CometChatReactions`.
 *
 * Usage (flat API — simplest):
 * ```tsx
 * <CometChatReactionList
 *   message={message}
 *   onItemClick={(reaction, msg) => CometChat.removeReaction(msg.getId(), reaction.getReaction())}
 *   onEmpty={() => setShowReactionList(false)}
 * />
 * ```
 *
 * Usage (compound composition — full control):
 * ```tsx
 * <CometChatReactionList.Root message={message} onItemClick={handleRemove}>
 *   <CometChatReactionList.Tabs />
 *   <CometChatReactionList.LoadingState />
 *   <CometChatReactionList.ErrorState />
 *   <CometChatReactionList.EmptyState />
 *   <CometChatReactionList.Items />
 * </CometChatReactionList.Root>
 * ```
 */
export const CometChatReactionList = Object.assign(CometChatReactionListComponent, {
  Root: CometChatReactionListRoot,
  Tabs: CometChatReactionListTabs,
  Items: CometChatReactionListItems,
  LoadingState: CometChatReactionListLoadingState,
  ErrorState: CometChatReactionListErrorState,
  EmptyState: CometChatReactionListEmptyState,
});
