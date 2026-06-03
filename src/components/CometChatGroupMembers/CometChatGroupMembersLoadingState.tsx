import React from 'react';
import type { CometChatGroupMembersLoadingStateProps } from './CometChatGroupMembers.types';
import './CometChatGroupMembers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupMembersLoadingState — Shimmer/skeleton loading state.
 */
export const CometChatGroupMembersLoadingState: React.FC<
  CometChatGroupMembersLoadingStateProps
> = ({ children }) => {
  const { getLocalizedString } = useLocale();
  const shimmerItems = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div
      className={'cometchat-group-members__loading-state'}
      aria-live="polite"
      aria-busy="true"
      aria-label={getLocalizedString('accessibility_loading_group_members')}
    >
      {children ?? (
        <>
          {shimmerItems.map(i => (
            <div key={i} className={'cometchat-group-members__shimmer-item'}>
              <div className={'cometchat-group-members__shimmer-item-avatar'} />
              <div className={'cometchat-group-members__shimmer-item-body'}>
                <div className={'cometchat-group-members__shimmer-item-title'} />
                <div className={'cometchat-group-members__shimmer-item-subtitle'} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

CometChatGroupMembersLoadingState.displayName = 'CometChatGroupMembers.LoadingState';
