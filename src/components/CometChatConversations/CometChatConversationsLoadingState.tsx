import React from 'react';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsLoadingStateProps } from './CometChatConversations.types';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';

const SHIMMER_COUNT = 12;

/**
 * CometChatConversationsLoadingState — Loading/shimmer state.
 *
 * Reads fetchState from context and only renders when fetchState === 'loading'.
 */
export const CometChatConversationsLoadingState: React.FC<
  CometChatConversationsLoadingStateProps
> = ({ children }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatConversationsContext();

  if (fetchState !== 'loading') return null;

  return (
    <div
      className={'cometchat-conversations__loading-state'}
      role="status"
      aria-busy="true"
      aria-label={getLocalizedString('accessibility_loading_conversations')}
    >
      {children ?? (
        <>
          {Array.from({ length: SHIMMER_COUNT }, (_, index) => (
            <div key={index} className={'cometchat-conversations__shimmer-item'}>
              <div className={'cometchat-conversations__shimmer-item-avatar'} />
              <div className={'cometchat-conversations__shimmer-item-body'}>
                <div className={'cometchat-conversations__shimmer-item-title'} />
                <div className={'cometchat-conversations__shimmer-item-subtitle'} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

CometChatConversationsLoadingState.displayName = 'CometChatConversations.LoadingState';
