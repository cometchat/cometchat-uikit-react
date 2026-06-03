import React from 'react';
import type { CometChatThreadViewIconProps } from './CometChatThreadView.types';
import './CometChatThreadView.css';

/**
 * Thread reply icon. Uses the default reply-in-thread SVG via CSS mask.
 * When a custom `iconURL` is provided, renders it as a background-image instead.
 */
export const CometChatThreadViewIcon: React.FC<CometChatThreadViewIconProps> = ({
  iconURL,
  className,
}) => {
  const baseClass = 'cometchat-thread-view__icon';
  const customClass = iconURL ? 'cometchat-thread-view__icon--custom' : '';
  const cls = [baseClass, customClass, className].filter(Boolean).join(' ');

  const customStyle: React.CSSProperties | undefined = iconURL
    ? { backgroundImage: `url(${iconURL})` }
    : undefined;

  return <span className={cls} style={customStyle} aria-hidden="true" />;
};
