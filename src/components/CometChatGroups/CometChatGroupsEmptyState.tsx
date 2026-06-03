import React from 'react';
import type { CometChatGroupsEmptyStateProps } from './CometChatGroups.types';
import groupsEmptyIcon from '../../assets/groups_empty_state.svg';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupsEmptyState — Empty state view when no groups are available.
 */
export const CometChatGroupsEmptyState: React.FC<CometChatGroupsEmptyStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  return (
    <div className={'cometchat-groups__empty-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-groups__empty-state-icon'} aria-hidden="true">
            <img
              src={groupsEmptyIcon}
              alt=""
              width={100}
              height={68}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={'cometchat-groups__empty-state-title'}>
            {getLocalizedString('group_empty_title')}
          </div>
          <div className={'cometchat-groups__empty-state-subtitle'}>
            Create or join groups to see them listed here.
          </div>
        </>
      )}
    </div>
  );
};

CometChatGroupsEmptyState.displayName = 'CometChatGroups.EmptyState';
