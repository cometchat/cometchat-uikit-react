import React from 'react';
import { CometChatSavedMessagesRoot } from './CometChatSavedMessagesRoot';
import { CometChatSavedMessagesList } from './CometChatSavedMessagesList';
import { CometChatSavedMessagesItem } from './CometChatSavedMessagesItem';
import { CometChatSavedMessagesHeader } from './CometChatSavedMessagesHeader';
import { CometChatSavedMessagesLoadingState } from './CometChatSavedMessagesLoadingState';
import { CometChatSavedMessagesErrorState } from './CometChatSavedMessagesErrorState';
import { CometChatSavedMessagesEmptyState } from './CometChatSavedMessagesEmptyState';
import type { CometChatSavedMessagesProps } from './CometChatSavedMessages.types';

/**
 * CometChatSavedMessages — the user-level, cross-conversation list of messages
 * this user has saved.
 *
 * Private by construction: `savedAt` is per-viewer, so every row here belongs to
 * the logged-in user and no one else can see it. Read-only surface: rendering it
 * never marks a conversation read, sends a receipt, or changes an unread count.
 *
 * Two ways to use it:
 * - Flat API: `<CometChatSavedMessages onItemClick={…} />` renders the default layout.
 * - Compound composition:
 *   ```tsx
 *   <CometChatSavedMessages.Root onItemClick={…}>
 *     <CometChatSavedMessages.Header />
 *     <CometChatSavedMessages.List />
 *   </CometChatSavedMessages.Root>
 *   ```
 */
const CometChatSavedMessagesComponent: React.FC<CometChatSavedMessagesProps> = props => {
  return <CometChatSavedMessagesRoot {...props} />;
};

CometChatSavedMessagesComponent.displayName = 'CometChatSavedMessages';

export const CometChatSavedMessages = Object.assign(CometChatSavedMessagesComponent, {
  Root: CometChatSavedMessagesRoot,
  List: CometChatSavedMessagesList,
  Item: CometChatSavedMessagesItem,
  Header: CometChatSavedMessagesHeader,
  EmptyState: CometChatSavedMessagesEmptyState,
  ErrorState: CometChatSavedMessagesErrorState,
  LoadingState: CometChatSavedMessagesLoadingState,
});
