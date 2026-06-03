import React from 'react';
import type { CometChatMessageComposerFooterProps } from './CometChatMessageComposer.types';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerFooter — custom footer slot below the input.
 */
export const CometChatMessageComposerFooter: React.FC<CometChatMessageComposerFooterProps> = ({
  children,
  className,
}) => {
  if (!children) return null;

  const footerClass = ['cometchat-message-composer__footer', className ?? '']
    .filter(Boolean)
    .join(' ');

  return <div className={footerClass}>{children}</div>;
};
