import React from 'react';
import type { CometChatSearchBarIconProps } from './CometChatSearchBar.types';
import './CometChatSearchBar.css';

/**
 * Decorative search icon. Not focusable, hidden from assistive technology.
 */
export const CometChatSearchBarIcon: React.FC<CometChatSearchBarIconProps> = ({
  icon,
  className,
}) => {
  const baseClass = 'cometchat-search-bar__icon';
  const cls = className ? `${baseClass} ${className}` : baseClass;

  if (icon) {
    return (
      <span className={cls} aria-hidden="true">
        {icon}
      </span>
    );
  }

  return <span className={cls} aria-hidden="true" />;
};
