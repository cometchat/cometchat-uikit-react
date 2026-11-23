import React from 'react';
import { useCometChatGroupsContext } from './CometChatGroups.context';
import type { CometChatGroupsErrorStateProps } from './CometChatGroups.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { OfflineListState } from '../../utils/offline/OfflineListState';
import groupsEmptyIcon from '../../assets/groups_empty_state.svg';

/**
 * CometChatGroupsErrorState — Error state view when fetching fails.
 */
export const CometChatGroupsErrorState: React.FC<CometChatGroupsErrorStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { fetchState, connectToLoad } = useCometChatGroupsContext();

  // Shown only in its state, wherever it is placed.
  if (fetchState !== 'error') return null;

  return (
    <div className={'cometchat-groups__error-state'} role="status">
      {children ??
        (connectToLoad ? (
          <OfflineListState
            block="cometchat-groups__error-state"
            icon={groupsEmptyIcon}
            title={getLocalizedString('groups_connect_to_load')}
          />
        ) : (
          <>
            <div className={'cometchat-groups__error-state-icon'} aria-hidden="true">
              <img
                src={listErrorIcon}
                alt=""
                width={120}
                height={120}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className={'cometchat-groups__error-state-title'}>
              {getLocalizedString('group_error_title')}
            </div>
            <div className={'cometchat-groups__error-state-subtitle'}>
              {getLocalizedString('group_error_subtitle')}
            </div>
          </>
        ))}
    </div>
  );
};

CometChatGroupsErrorState.displayName = 'CometChatGroups.ErrorState';
