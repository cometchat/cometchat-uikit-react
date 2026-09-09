import React from 'react';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import { CometChatConversationsShimmer } from './CometChatConversationsShimmer';
import type { CometChatConversationsLoadingStateProps } from './CometChatConversations.types';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatConversationsLoadingState — Loading/shimmer state.
 *
 * Reads fetchState from context and only renders when fetchState === 'loading'.
 * The skeleton itself lives in {@link CometChatConversationsShimmer}, so surfaces
 * without this context can use it.
 */
export const CometChatConversationsLoadingState: React.FC<
  CometChatConversationsLoadingStateProps
> = ({ children }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatConversationsContext();

  if (fetchState !== 'loading') return null;

  if (children) {
    return (
      <div
        className={'cometchat-conversations__loading-state'}
        role="status"
        aria-busy="true"
        aria-label={getLocalizedString('accessibility_loading_conversations')}
      >
        {children}
      </div>
    );
  }

  return (
    <CometChatConversationsShimmer
      ariaLabel={getLocalizedString('accessibility_loading_conversations')}
    />
  );
};

CometChatConversationsLoadingState.displayName = 'CometChatConversations.LoadingState';
