import React from 'react';
import { useCometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersErrorStateProps } from './CometChatUsers.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatUsers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatUsersErrorState — Error state view when fetching fails.
 *
 * Reads fetchState from context and only renders when fetchState === 'error'.
 */
export const CometChatUsersErrorState: React.FC<CometChatUsersErrorStateProps> = ({ children }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatUsersContext();

  if (fetchState !== 'error') return null;

  return (
    <div className={'cometchat-users__error-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-users__error-state-icon'} aria-hidden="true">
            <img
              src={listErrorIcon}
              alt=""
              width={100}
              height={68}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={'cometchat-users__error-state-title'}>
            {getLocalizedString('user_error_title')}
          </div>
          <div className={'cometchat-users__error-state-subtitle'}>
            {getLocalizedString('user_error_subtitle')}
          </div>
        </>
      )}
    </div>
  );
};

CometChatUsersErrorState.displayName = 'CometChatUsers.ErrorState';
