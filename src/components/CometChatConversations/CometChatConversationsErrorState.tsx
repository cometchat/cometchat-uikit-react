import React from 'react';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsErrorStateProps } from './CometChatConversations.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { OfflineListState } from '../../utils/offline/OfflineListState';
import conversationsEmptyIcon from '../../assets/conversations_empty_state.svg';

/**
 * CometChatConversationsErrorState — Error state view when fetching fails.
 *
 * Reads fetchState from context and only renders when fetchState === 'error'.
 */
export const CometChatConversationsErrorState: React.FC<CometChatConversationsErrorStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { fetchState, connectToLoad } = useCometChatConversationsContext();

  if (fetchState !== 'error') return null;

  return (
    <div
      className={'cometchat-conversations__error-state'}
      role="status"
      data-cc="error"
      data-cc-reason="conversations"
    >
      {children ??
        (connectToLoad ? (
          <OfflineListState
            block="cometchat-conversations__error-state"
            icon={conversationsEmptyIcon}
            title={getLocalizedString('conversations_connect_to_load')}
          />
        ) : (
          <>
            <div className={'cometchat-conversations__error-state-icon'} aria-hidden="true">
              <img
                src={listErrorIcon}
                alt=""
                width={120}
                height={120}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className={'cometchat-conversations__error-state-title'}>
              {getLocalizedString('conversation_error_title')}
            </div>
            <div className={'cometchat-conversations__error-state-subtitle'}>
              {getLocalizedString('conversation_error_subtitle')}
            </div>
          </>
        ))}
    </div>
  );
};

CometChatConversationsErrorState.displayName = 'CometChatConversations.ErrorState';
