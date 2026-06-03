import React from 'react';
import { useCometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersEmptyStateProps } from './CometChatUsers.types';
import userEmptyIcon from '../../assets/user_empty.svg';
import './CometChatUsers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatUsersEmptyState — Empty state view when no users are available.
 *
 * Reads fetchState from context and only renders when fetchState === 'empty'.
 */
export const CometChatUsersEmptyState: React.FC<CometChatUsersEmptyStateProps> = ({ children }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatUsersContext();

  if (fetchState !== 'empty') return null;

  return (
    <div className={'cometchat-users__empty-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-users__empty-state-icon'} aria-hidden="true">
            <img
              src={userEmptyIcon}
              alt=""
              width={100}
              height={68}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={'cometchat-users__empty-state-title'}>
            {getLocalizedString('user_empty_title')}
          </div>
          <div className={'cometchat-users__empty-state-subtitle'}>
            There are no users available at the moment.
          </div>
        </>
      )}
    </div>
  );
};

CometChatUsersEmptyState.displayName = 'CometChatUsers.EmptyState';
