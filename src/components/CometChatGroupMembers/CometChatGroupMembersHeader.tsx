import React from 'react';
import type { CometChatGroupMembersHeaderProps } from './CometChatGroupMembers.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatGroupMembers.css';

/**
 * CometChatGroupMembersHeader — Title bar for the group members list.
 */
export const CometChatGroupMembersHeader: React.FC<CometChatGroupMembersHeaderProps> = ({
  title,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const displayTitle = title ?? getLocalizedString('group_members_header');
  return (
    <div className={'cometchat-group-members__header'}>
      {children ?? <h2 className={'cometchat-group-members__header-title'}>{displayTitle}</h2>}
    </div>
  );
};

CometChatGroupMembersHeader.displayName = 'CometChatGroupMembers.Header';
