import React from 'react';
import type { ReactNode } from 'react';
import './CometChatMessageList.css';

export interface CometChatMessageListHeaderProps {
  children?: ReactNode;
}

/**
 * CometChatMessageListHeader — optional header slot above the message list.
 */
export const CometChatMessageListHeader: React.FC<CometChatMessageListHeaderProps> = ({
  children,
}) => {
  if (!children) return null;
  return <div className={'cometchat-message-list__header-view'}>{children}</div>;
};

CometChatMessageListHeader.displayName = 'CometChatMessageListHeader';
