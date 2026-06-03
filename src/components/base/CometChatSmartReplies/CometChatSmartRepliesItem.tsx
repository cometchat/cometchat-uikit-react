import React from 'react';
import type { CometChatSmartRepliesItemProps } from './CometChatSmartReplies.types';
import { useCometChatSmartRepliesContext } from './CometChatSmartReplies.context';
import './CometChatSmartReplies.css';

/**
 * Single reply suggestion button.
 */
export const CometChatSmartRepliesItem: React.FC<CometChatSmartRepliesItemProps> = ({
  reply,
  className,
}) => {
  const { onSuggestionClick } = useCometChatSmartRepliesContext();

  const itemBase = 'cometchat-smart-replies__item';
  const itemClass = className ? `${itemBase} ${className}` : itemBase;

  return (
    <button type="button" className={itemClass} onClick={() => onSuggestionClick?.(reply)}>
      {reply}
    </button>
  );
};
