import React from 'react';
import { CometChatConversationStarterRoot } from './CometChatConversationStarterRoot';
import { CometChatConversationStarterItem } from './CometChatConversationStarterItem';
import { CometChatConversationStarterLoading } from './CometChatConversationStarterLoading';
import { CometChatConversationStarterError } from './CometChatConversationStarterError';
import { CometChatConversationStarterEmpty } from './CometChatConversationStarterEmpty';
import type { CometChatConversationStarterRootProps } from './CometChatConversationStarter.types';

/**
 * Flat API props for CometChatConversationStarter.
 * Same as Root props without children — renders default item list automatically.
 */
export type CometChatConversationStarterProps = Omit<
  CometChatConversationStarterRootProps,
  'children'
>;

/**
 * CometChatConversationStarter — Flat API component.
 *
 * Fetches and displays AI-generated conversation starters.
 * Renders items automatically when loaded (no subcomponent composition needed).
 *
 * Usage (flat):
 * ```tsx
 * <CometChatConversationStarter
 *   getConversationStarters={fetchStarters}
 *   onSuggestionClick={handleClick}
 * />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatConversationStarter.Root getConversationStarters={fetchStarters} onSuggestionClick={handleClick}>
 *   <CometChatConversationStarter.Loading />
 *   <CometChatConversationStarter.Error />
 *   <CometChatConversationStarter.Empty />
 * </CometChatConversationStarter.Root>
 * ```
 */
const CometChatConversationStarterComponent: React.FC<
  CometChatConversationStarterProps
> = props => {
  return <CometChatConversationStarterRoot {...props} />;
};

CometChatConversationStarterComponent.displayName = 'CometChatConversationStarter';

export const CometChatConversationStarter = Object.assign(CometChatConversationStarterComponent, {
  Root: CometChatConversationStarterRoot,
  Item: CometChatConversationStarterItem,
  Loading: CometChatConversationStarterLoading,
  Error: CometChatConversationStarterError,
  Empty: CometChatConversationStarterEmpty,
});
