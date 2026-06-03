import React from 'react';
import type { CometChatGroupMembersErrorStateProps } from './CometChatGroupMembers.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatGroupMembers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupMembersErrorState — Displayed when fetching members fails.
 */
export const CometChatGroupMembersErrorState: React.FC<CometChatGroupMembersErrorStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  return (
    <div className={'cometchat-group-members__error-state'} role="alert">
      {children ?? (
        <>
          <div className={'cometchat-group-members__error-state-icon'} aria-hidden="true">
            <img
              src={listErrorIcon}
              alt=""
              width={100}
              height={100}
              loading="lazy"
              decoding="async"
            />
          </div>
          <h3 className={'cometchat-group-members__error-state-title'}>
            {getLocalizedString('member_error_title')}
          </h3>
          <p className={'cometchat-group-members__error-state-subtitle'}>
            {getLocalizedString('member_error_subtitle')}
          </p>
        </>
      )}
    </div>
  );
};

CometChatGroupMembersErrorState.displayName = 'CometChatGroupMembers.ErrorState';
