import React from 'react';
import { useCometChatGroupMembersContext } from './CometChatGroupMembers.context';
import type { CometChatGroupMembersEmptyStateProps } from './CometChatGroupMembers.types';
import groupsEmptyIcon from '../../assets/groups_empty_state.svg';
import './CometChatGroupMembers.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { OfflineListState } from '../../utils/offline/OfflineListState';

/**
 * CometChatGroupMembersEmptyState — Displayed when no members are found.
 */
export const CometChatGroupMembersEmptyState: React.FC<CometChatGroupMembersEmptyStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { fetchState, connectToSearch } = useCometChatGroupMembersContext();

  // Shown only in its state, wherever it is placed.
  if (fetchState !== 'empty') return null;

  return (
    <div className={'cometchat-group-members__empty-state'} role="status">
      {children ??
        (connectToSearch ? (
          <OfflineListState
            block="cometchat-group-members__empty-state"
            icon={groupsEmptyIcon}
            title={getLocalizedString('search_connect_to_search')}
            subtitle={getLocalizedString('search_connect_to_search_subtitle')}
          />
        ) : (
          <>
            <div className={'cometchat-group-members__empty-state-icon'} aria-hidden="true">
              <img
                src={groupsEmptyIcon}
                alt=""
                width={120}
                height={120}
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
        ))}
    </div>
  );
};

CometChatGroupMembersEmptyState.displayName = 'CometChatGroupMembers.EmptyState';
