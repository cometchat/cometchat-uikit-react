import React from 'react';
import type { CometChatButtonIconProps } from './CometChatButton.types';
import { useCometChatButtonContext } from './CometChatButton.context';
import './CometChatButton.css';

/**
 * Icon slot for CometChatButton. Reads context to adjust size.
 */
export const CometChatButtonIcon: React.FC<CometChatButtonIconProps> = ({
  children,
  className,
}) => {
  const { size } = useCometChatButtonContext();

  const baseClass = 'cometchat-button__icon';
  const sizeClass = `cometchat-button__icon--${size}`;
  const classes = [baseClass, sizeClass, className].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
};
