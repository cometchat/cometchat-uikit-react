import React from 'react';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsErrorStateProps } from './CometChatConversations.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatConversationsErrorState — Error state view when fetching fails.
 *
 * Reads fetchState from context and only renders when fetchState === 'error'.
 */
export const CometChatConversationsErrorState: React.FC<CometChatConversationsErrorStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatConversationsContext();

  if (fetchState !== 'error') return null;

  return (
    <div className={'cometchat-conversations__error-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-conversations__error-state-icon'} aria-hidden="true">
            <img
              src={listErrorIcon}
              alt=""
              width={100}
              height={68}
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
      )}
    </div>
  );
};

CometChatConversationsErrorState.displayName = 'CometChatConversations.ErrorState';
