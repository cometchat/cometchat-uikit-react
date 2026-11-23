import React from 'react';
import { useCometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersErrorStateProps } from './CometChatUsers.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatUsers.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { OfflineListState } from '../../utils/offline/OfflineListState';
import userEmptyIcon from '../../assets/user_empty.svg';

/**
 * CometChatUsersErrorState — Error state view when fetching fails.
 *
 * Reads fetchState from context and only renders when fetchState === 'error'.
 * Offline with nothing saved (`connectToLoad`) it reads "Connect to load users", with no
 * retry, unless the app passed its own error view.
 */
export const CometChatUsersErrorState: React.FC<CometChatUsersErrorStateProps> = ({ children }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState, connectToLoad } = useCometChatUsersContext();

  if (fetchState !== 'error') return null;

  return (
    <div className={'cometchat-users__error-state'} role="status">
      {children ??
        (connectToLoad ? (
          <OfflineListState
            block="cometchat-users__error-state"
            icon={userEmptyIcon}
            title={getLocalizedString('users_connect_to_load')}
          />
        ) : (
          <>
            <div className={'cometchat-users__error-state-icon'} aria-hidden="true">
              <img
                src={listErrorIcon}
                alt=""
                width={120}
                height={120}
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
        ))}
    </div>
  );
};

CometChatUsersErrorState.displayName = 'CometChatUsers.ErrorState';
