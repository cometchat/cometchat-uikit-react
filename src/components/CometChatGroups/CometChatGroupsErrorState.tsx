import React from 'react';
import type { CometChatGroupsErrorStateProps } from './CometChatGroups.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupsErrorState — Error state view when fetching fails.
 */
export const CometChatGroupsErrorState: React.FC<CometChatGroupsErrorStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  return (
    <div className={'cometchat-groups__error-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-groups__error-state-icon'} aria-hidden="true">
            <img
              src={listErrorIcon}
              alt=""
              width={100}
              height={100}
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
      )}
    </div>
  );
};

CometChatGroupsErrorState.displayName = 'CometChatGroups.ErrorState';
