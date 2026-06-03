import React, { useCallback } from 'react';
import type { CometChatConversationStarterItemProps } from './CometChatConversationStarter.types';
import './CometChatConversationStarter.css';

/**
 * A single suggestion rendered as a pill-shaped button.
 */
export const CometChatConversationStarterItem: React.FC<CometChatConversationStarterItemProps> = ({
  suggestion,
  onClick,
  disabled,
  className,
}) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick?.(suggestion);
    }
  }, [disabled, onClick, suggestion]);

  const itemBase = 'cometchat-conversation-starter__item';
  const disabledClass = disabled ? ` cometchat-conversation-starter__item--disabled` : '';
  const itemClass = className
    ? `${itemBase}${disabledClass} ${className}`
    : `${itemBase}${disabledClass}`;

  return (
    <div className={itemClass}>
      <button
        type="button"
        className={'cometchat-conversation-starter__item-button'}
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled ? 'true' : undefined}
      >
        {suggestion}
      </button>
    </div>
  );
};
