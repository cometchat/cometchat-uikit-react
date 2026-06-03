import React from 'react';
import type { CometChatMessageBubbleWrapperProps } from './CometChatMessageBubble.types';
import './CometChatMessageBubble.css';

/**
 * CometChatMessageBubbleWrapper — alignment wrapper for message bubbles.
 *
 * Handles flex alignment (left/right/center) based on message direction.
 *
 * Used by the MessageList UI to wrap each CometChatMessageBubbleRenderer.
 */
export const CometChatMessageBubbleWrapper: React.FC<CometChatMessageBubbleWrapperProps> = ({
  alignment,
  children,
  className,
}) => {
  const classes = [
    'cometchat-message-bubble-wrapper',
    `cometchat-message-bubble-wrapper--${alignment}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
};

CometChatMessageBubbleWrapper.displayName = 'CometChatMessageBubbleWrapper';
