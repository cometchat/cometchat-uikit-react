import React, { useCallback, useMemo } from 'react';
import type { CometChatReactionsRootProps } from './CometChatReactions.types';
import { CometChatReactionsContext } from './CometChatReactions.context';
import { CometChatReactionsBar } from './CometChatReactionsBar';
import './CometChatReactions.css';

/**
 * CometChatReactions.Root — context provider and root container.
 *
 * Provides bar-relevant context to sub-components.
 * When no children are provided, renders the default Bar layout.
 */
export const CometChatReactionsRoot: React.FC<CometChatReactionsRootProps> = ({
  message,
  alignment = 'left',
  reactionsRequestBuilder,
  onReactionClick,
  hoverDebounceTime = 500,
  onError,
  children,
  className,
}) => {
  // Derive reaction counts directly from the message
  const reactions = useMemo(() => message.getReactions(), [message]);

  // Compute visible reactions and overflow (default maxVisible = all)
  const maxVisible = reactions.length;
  const visibleReactions = reactions;
  const overflowCount = 0;

  const handleReactionClick = useCallback(
    (emoji: string) => {
      onReactionClick?.(emoji, message);
    },
    [onReactionClick, message]
  );

  const contextValue = useMemo(
    () => ({
      message,
      reactions,
      alignment,
      maxVisible,
      visibleReactions,
      overflowCount,
      onReactionClick: handleReactionClick,
      reactionsRequestBuilder,
      hoverDebounceTime,
      onError,
    }),
    [
      message,
      reactions,
      alignment,
      maxVisible,
      visibleReactions,
      overflowCount,
      handleReactionClick,
      reactionsRequestBuilder,
      hoverDebounceTime,
      onError,
    ]
  );

  const rootClass = ['cometchat-reactions', className ?? ''].filter(Boolean).join(' ');

  // Don't render if no reactions
  if (reactions.length === 0) return null;

  return (
    <CometChatReactionsContext.Provider value={contextValue}>
      <div className={rootClass}>{children ?? <CometChatReactionsBar />}</div>
    </CometChatReactionsContext.Provider>
  );
};
