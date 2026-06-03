import React from 'react';
import type { CometChatButtonTextProps } from './CometChatButton.types';
import './CometChatButton.css';

/**
 * Text slot for CometChatButton.
 */
export const CometChatButtonText: React.FC<CometChatButtonTextProps> = ({
  children,
  className,
}) => {
  const baseClass = 'cometchat-button__text';
  const classes = className ? `${baseClass} ${className}` : baseClass;

  return <span className={classes}>{children}</span>;
};
