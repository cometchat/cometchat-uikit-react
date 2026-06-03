import React from 'react';
import type { CometChatMessageHeaderAuxiliaryButtonsProps } from './CometChatMessageHeader.types';
import './CometChatMessageHeader.css';

/**
 * CometChatMessageHeaderAuxiliaryButtons — custom auxiliary button slot.
 *
 * Renders consumer-provided auxiliary buttons in the trailing section.
 * This is a pass-through container for custom content.
 */
export const CometChatMessageHeaderAuxiliaryButtons: React.FC<
  CometChatMessageHeaderAuxiliaryButtonsProps
> = ({ className, children }) => {
  if (!children) return null;

  const rootClasses = ['cometchat-message-header__auxiliary-buttons', className]
    .filter(Boolean)
    .join(' ');

  return <div className={rootClasses}>{children}</div>;
};

CometChatMessageHeaderAuxiliaryButtons.displayName = 'CometChatMessageHeaderAuxiliaryButtons';
