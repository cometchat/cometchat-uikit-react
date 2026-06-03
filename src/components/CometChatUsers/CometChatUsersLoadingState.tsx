import React from 'react';
import { useCometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersLoadingStateProps } from './CometChatUsers.types';
import './CometChatUsers.css';
import { useLocale } from '../../context/locale/LocaleContext';

const SHIMMER_COUNT = 12;

/**
 * CometChatUsersLoadingState — Loading/shimmer state.
 *
 * Reads fetchState from context and only renders when fetchState === 'loading'.
 * When used inside compound composition, it self-manages visibility.
 */
export const CometChatUsersLoadingState: React.FC<CometChatUsersLoadingStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatUsersContext();

  if (fetchState !== 'loading') return null;

  return (
    <div
      className={'cometchat-users__loading-state'}
      role="status"
      aria-busy="true"
      aria-label={getLocalizedString('accessibility_loading_users')}
    >
      {children ?? (
        <>
          {Array.from({ length: SHIMMER_COUNT }, (_, index) => (
            <div key={index} className={'cometchat-users__shimmer-item'}>
              <div className={'cometchat-users__shimmer-item-avatar'} />
              <div className={'cometchat-users__shimmer-item-title'} />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

CometChatUsersLoadingState.displayName = 'CometChatUsers.LoadingState';
