import React from 'react';
import type { CometChatGroupsHeaderProps } from './CometChatGroups.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatGroups.css';

/**
 * CometChatGroupsHeader — Header with title.
 */
export const CometChatGroupsHeader: React.FC<CometChatGroupsHeaderProps> = ({
  title,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const displayTitle = title ?? getLocalizedString('group_title');
  return (
    <div className={'cometchat-groups__header'}>
      {children ?? <h1 className={'cometchat-groups__header-title'}>{displayTitle}</h1>}
    </div>
  );
};

CometChatGroupsHeader.displayName = 'CometChatGroups.Header';
