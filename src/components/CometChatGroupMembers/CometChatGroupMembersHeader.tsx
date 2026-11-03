import React, { useContext } from 'react';
import type { CometChatGroupMembersHeaderProps } from './CometChatGroupMembers.types';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatGroupMembersContext } from './CometChatGroupMembers.context';
import './CometChatGroupMembers.css';

/**
 * CometChatGroupMembersHeader — Title bar for the group members list, with a back button when
 * the root has `onBack`.
 */
export const CometChatGroupMembersHeader: React.FC<CometChatGroupMembersHeaderProps> = ({
  title,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  // Read without the throwing hook: the header can also be rendered on its own.
  const onBack = useContext(CometChatGroupMembersContext)?.onBack;
  const displayTitle = title ?? getLocalizedString('group_members_header');
  return (
    <div className={'cometchat-group-members__header'}>
      {children ?? (
        <>
          {onBack && (
            <button
              type="button"
              className={'cometchat-group-members__back-button'}
              aria-label={getLocalizedString('accessibility_back')}
              onClick={onBack}
            >
              <span className={'cometchat-group-members__back-button-icon'} aria-hidden="true" />
            </button>
          )}
          <h2 className={'cometchat-group-members__header-title'}>{displayTitle}</h2>
        </>
      )}
    </div>
  );
};

CometChatGroupMembersHeader.displayName = 'CometChatGroupMembers.Header';
