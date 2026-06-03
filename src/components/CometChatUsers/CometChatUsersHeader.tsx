import React from 'react';
import type { CometChatUsersHeaderProps } from './CometChatUsers.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatUsers.css';

/**
 * CometChatUsersHeader — Header with title.
 */
export const CometChatUsersHeader: React.FC<CometChatUsersHeaderProps> = ({ title, children }) => {
  const { getLocalizedString } = useLocale();
  const displayTitle = title ?? getLocalizedString('user_title');
  return (
    <div className={'cometchat-users__header'}>
      {children ?? <h1 className={'cometchat-users__header-title'}>{displayTitle}</h1>}
    </div>
  );
};

CometChatUsersHeader.displayName = 'CometChatUsers.Header';
