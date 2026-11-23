import React from 'react';
import { useCometChatGroupsContext } from './CometChatGroups.context';
import type { CometChatGroupsEmptyStateProps } from './CometChatGroups.types';
import groupsEmptyIcon from '../../assets/groups_empty_state.svg';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { OfflineListState } from '../../utils/offline/OfflineListState';

/**
 * CometChatGroupsEmptyState — Empty state view when no groups are available.
 */
export const CometChatGroupsEmptyState: React.FC<CometChatGroupsEmptyStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { fetchState, connectToSearch } = useCometChatGroupsContext();

  // Shown only in its state, wherever it is placed.
  if (fetchState !== 'empty') return null;

  return (
    <div className={'cometchat-groups__empty-state'} role="status">
      {children ??
        (connectToSearch ? (
          <OfflineListState
            block="cometchat-groups__empty-state"
            icon={groupsEmptyIcon}
            title={getLocalizedString('search_connect_to_search')}
            subtitle={getLocalizedString('search_connect_to_search_subtitle')}
          />
        ) : (
          <>
            <div className={'cometchat-groups__empty-state-icon'} aria-hidden="true">
              <img
                src={groupsEmptyIcon}
                alt=""
                width={120}
                height={120}
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
        ))}
    </div>
  );
};

CometChatGroupsEmptyState.displayName = 'CometChatGroups.EmptyState';
