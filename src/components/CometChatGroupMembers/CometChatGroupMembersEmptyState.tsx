import React from 'react';
import type { CometChatGroupMembersEmptyStateProps } from './CometChatGroupMembers.types';
import groupsEmptyIcon from '../../assets/groups_empty_state.svg';
import './CometChatGroupMembers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupMembersEmptyState — Displayed when no members are found.
 */
export const CometChatGroupMembersEmptyState: React.FC<CometChatGroupMembersEmptyStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  return (
    <div className={'cometchat-group-members__empty-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-group-members__empty-state-icon'} aria-hidden="true">
            <img
              src={groupsEmptyIcon}
              alt=""
              width={100}
              height={68}
              loading="lazy"
              decoding="async"
            />
          </div>
          <h3 className={'cometchat-group-members__empty-state-title'}>
            {getLocalizedString('member_empty_title')}
          </h3>
          <p className={'cometchat-group-members__empty-state-subtitle'}>
            There are no members in this group yet.
          </p>
        </>
      )}
    </div>
  );
};

CometChatGroupMembersEmptyState.displayName = 'CometChatGroupMembers.EmptyState';
