import React, { useCallback } from 'react';
import type { CometChatThreadHeaderSenderNameProps } from './CometChatThreadHeader.types';
import { useCometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import './CometChatThreadHeader.css';

/**
 * CometChatThreadHeaderSenderName — displays the sender name of the parent message.
 *
 * Reads the sender name from the thread header context.
 * When `onSubtitleClicked` is provided, the name is clickable (navigates to parent in main list).
 */
export const CometChatThreadHeaderSenderName: React.FC<CometChatThreadHeaderSenderNameProps> = ({
  className,
}) => {
  const { senderName, onSubtitleClicked } = useCometChatThreadHeaderContext();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onSubtitleClicked && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onSubtitleClicked();
      }
    },
    [onSubtitleClicked]
  );

  if (!senderName) {
    return null;
  }

  const senderClasses = [
    'cometchat-thread-header__sender-name',
    onSubtitleClicked ? 'cometchat-thread-header__sender-name--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={senderClasses}
      onClick={onSubtitleClicked}
      onKeyDown={handleKeyDown}
      role={onSubtitleClicked ? 'button' : undefined}
      tabIndex={onSubtitleClicked ? 0 : undefined}
    >
      {senderName}
    </span>
  );
};

CometChatThreadHeaderSenderName.displayName = 'CometChatThreadHeaderSenderName';
