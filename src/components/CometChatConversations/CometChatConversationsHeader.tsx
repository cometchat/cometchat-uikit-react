import React from 'react';
import type { CometChatConversationsHeaderProps } from './CometChatConversations.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatConversations.css';

/**
 * CometChatConversationsHeader — Header with title.
 */
export const CometChatConversationsHeader: React.FC<CometChatConversationsHeaderProps> = ({
  title,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const displayTitle = title ?? getLocalizedString('conversation_chat_title');
  return (
    <div className={'cometchat-conversations__header'}>
      {children ?? <h1 className={'cometchat-conversations__header-title'}>{displayTitle}</h1>}
    </div>
  );
};

CometChatConversationsHeader.displayName = 'CometChatConversations.Header';
