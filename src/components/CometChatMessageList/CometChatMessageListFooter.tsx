import React from 'react';
import type { ReactNode } from 'react';
import './CometChatMessageList.css';

export interface CometChatMessageListFooterProps {
  children?: ReactNode;
}

/**
 * CometChatMessageListFooter — optional footer slot below the message list scroll area.
 */
export const CometChatMessageListFooter: React.FC<CometChatMessageListFooterProps> = ({
  children,
}) => {
  if (!children) return null;
  return <div className={'cometchat-message-list__footer-view'}>{children}</div>;
};

CometChatMessageListFooter.displayName = 'CometChatMessageListFooter';
