import React from 'react';
import type { CometChatMessageComposerAuxiliaryButtonsProps } from './CometChatMessageComposer.types';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerAuxiliaryButtons — generic slot for plugin-injected buttons.
 *
 * Plugins (stickers, AI, etc.) can inject their buttons here without
 * the composer needing to know about them.
 */
export const CometChatMessageComposerAuxiliaryButtons: React.FC<
  CometChatMessageComposerAuxiliaryButtonsProps
> = ({ children, className }) => {
  if (!children) return null;

  const auxClass = ['cometchat-message-composer__auxiliary-buttons', className ?? '']
    .filter(Boolean)
    .join(' ');

  return <div className={auxClass}>{children}</div>;
};
