import React from 'react';
import {
  CometChatPinnedMessagesRoot,
  PINNED_DEFAULT_QUICK_OPTIONS_COUNT,
} from './CometChatPinnedMessagesRoot';
import { CometChatPinnedMessagesList } from './CometChatPinnedMessagesList';
import { CometChatPinnedMessagesItem } from './CometChatPinnedMessagesItem';
import { CometChatPinnedMessagesHeader } from './CometChatPinnedMessagesHeader';
import { CometChatPinnedMessagesLoadingState } from './CometChatPinnedMessagesLoadingState';
import { CometChatPinnedMessagesErrorState } from './CometChatPinnedMessagesErrorState';
import { CometChatPinnedMessagesEmptyState } from './CometChatPinnedMessagesEmptyState';
import type { CometChatPinnedMessagesProps } from './CometChatPinnedMessages.types';

export { PINNED_DEFAULT_QUICK_OPTIONS_COUNT };

/**
 * CometChatPinnedMessages — one conversation's pinned messages.
 *
 * Pins are conversation-wide: everyone sees the same list — the server enforces who may actually fetch the list (a denial will not show the pinned messages and instead render an error state). Read-only surface: rendering it never marks a conversation read or
 * changes unread counts.
 *
 * Two ways to use it:
 * - Flat API: `<CometChatPinnedMessages group={…} onItemClick={…} />`.
 * - Compound composition:
 *   ```tsx
 *   <CometChatPinnedMessages.Root group={…}>
 *     <CometChatPinnedMessages.Header />
 *     <CometChatPinnedMessages.List />
 *   </CometChatPinnedMessages.Root>
 *   ```
 */
const CometChatPinnedMessagesComponent: React.FC<CometChatPinnedMessagesProps> = props => {
  return <CometChatPinnedMessagesRoot {...props} />;
};

CometChatPinnedMessagesComponent.displayName = 'CometChatPinnedMessages';

export const CometChatPinnedMessages = Object.assign(CometChatPinnedMessagesComponent, {
  Root: CometChatPinnedMessagesRoot,
  List: CometChatPinnedMessagesList,
  Item: CometChatPinnedMessagesItem,
  Header: CometChatPinnedMessagesHeader,
  EmptyState: CometChatPinnedMessagesEmptyState,
  ErrorState: CometChatPinnedMessagesErrorState,
  LoadingState: CometChatPinnedMessagesLoadingState,
});
