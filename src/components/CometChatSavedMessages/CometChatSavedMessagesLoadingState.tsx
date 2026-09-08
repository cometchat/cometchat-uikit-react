import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { CometChatConversationsShimmer } from '../CometChatConversations/CometChatConversationsShimmer';
import { useCometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import type { CometChatSavedMessagesSlotProps } from './CometChatSavedMessages.types';

/**
 * CometChatSavedMessages.LoadingState — conversation-row skeleton shown on the
 * initial load (this panel renders rows, not bubbles). Self-gates on fetch state.
 */
export const CometChatSavedMessagesLoadingState: React.FC<CometChatSavedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { fetchState, messages } = useCometChatSavedMessagesContext();

  if (fetchState !== 'loading' || messages.length > 0) return null;
  if (children !== undefined) return <>{children}</>;

  return (
    <CometChatConversationsShimmer
      className={'cometchat-saved-messages__shimmer'}
      ariaLabel={loc('accessibility_loading_conversations', 'Loading conversations')}
    />
  );
};

CometChatSavedMessagesLoadingState.displayName = 'CometChatSavedMessages.LoadingState';
