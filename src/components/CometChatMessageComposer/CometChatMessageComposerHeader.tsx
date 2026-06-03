import React from 'react';
import type { CometChatMessageComposerHeaderProps } from './CometChatMessageComposer.types';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerHeader — custom header slot above the input.
 */
export const CometChatMessageComposerHeader: React.FC<CometChatMessageComposerHeaderProps> = ({
  children,
  className,
}) => {
  if (!children) return null;

  const headerClass = ['cometchat-message-composer__header', className ?? '']
    .filter(Boolean)
    .join(' ');

  return <div className={headerClass}>{children}</div>;
};
