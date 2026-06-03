import React from 'react';
import type { CometChatGroupsLoadingStateProps } from './CometChatGroups.types';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';

const SHIMMER_COUNT = 12;

/**
 * CometChatGroupsLoadingState — Loading/shimmer state.
 *
 * Shows avatar + title + subtitle (member count) shimmer items.
 */
export const CometChatGroupsLoadingState: React.FC<CometChatGroupsLoadingStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  return (
    <div
      className={'cometchat-groups__loading-state'}
      role="status"
      aria-busy="true"
      aria-label={getLocalizedString('accessibility_loading_groups')}
    >
      {children ?? (
        <>
          {Array.from({ length: SHIMMER_COUNT }, (_, index) => (
            <div key={index} className={'cometchat-groups__shimmer-item'}>
              <div className={'cometchat-groups__shimmer-item-avatar'} />
              <div className={'cometchat-groups__shimmer-item-body'}>
                <div className={'cometchat-groups__shimmer-item-title'} />
                <div className={'cometchat-groups__shimmer-item-subtitle'} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

CometChatGroupsLoadingState.displayName = 'CometChatGroups.LoadingState';
