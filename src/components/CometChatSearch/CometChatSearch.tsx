import React from 'react';
import { CometChatSearchRoot } from './CometChatSearchRoot';
import { CometChatSearchConversationsList } from './CometChatSearchConversationsList';
import { CometChatSearchMessagesList } from './CometChatSearchMessagesList';
import type { CometChatSearchProps } from './CometChatSearch.types';

/**
 * CometChatSearch — Flat API component.
 *
 * Provides a full-featured search experience with:
 * - Debounced search input with clear button
 * - Filter chips (audio, photos, videos, files, links, groups, unread)
 * - Conversation results with real-time updates
 * - Message results with type-specific leading/trailing views
 * - Unified empty/error state coordination when both scopes are active
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatSearch
 *   onConversationClicked={({ conversation }) => openChat(conversation)}
 *   onMessageClicked={({ message }) => jumpToMessage(message)}
 *   onBack={() => setShowSearch(false)}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatSearch.Root onConversationClicked={handleConvClick}>
 *   <CometChatSearch.ConversationsList />
 *   <CometChatSearch.MessagesList />
 * </CometChatSearch.Root>
 * ```
 */
const CometChatSearchComponent: React.FC<CometChatSearchProps> = props => {
  return <CometChatSearchRoot {...props} />;
};

CometChatSearchComponent.displayName = 'CometChatSearch';

/**
 * CometChatSearch — Compound component namespace with flat API.
 *
 * - `<CometChatSearch ... />` — flat API
 * - `<CometChatSearch.Root>...</CometChatSearch.Root>` — compound composition
 */
export const CometChatSearch = Object.assign(CometChatSearchComponent, {
  Root: CometChatSearchRoot,
  ConversationsList: CometChatSearchConversationsList,
  MessagesList: CometChatSearchMessagesList,
});
