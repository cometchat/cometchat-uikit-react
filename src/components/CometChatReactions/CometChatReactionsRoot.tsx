import React, { useCallback, useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatReactionsRootProps } from './CometChatReactions.types';
import { CometChatReactionsContext } from './CometChatReactions.context';
import { useCometChatReactions } from './useCometChatReactions';
import { CometChatReactionsBar } from './CometChatReactionsBar';
import './CometChatReactions.css';

/**
 * CometChatReactions.Root — context provider and root container.
 *
 * Initializes the reactions hook, provides context to sub-components.
 * When no children are provided, renders the default Bar layout.
 */
export const CometChatReactionsRoot: React.FC<CometChatReactionsRootProps> = ({
  message,
  alignment = 'left',
  reactionsRequestBuilder,
  onReactionClick,
  onReactorClick,
  hoverDebounceTime = 500,
  onError,
  children,
  className,
}) => {
  const {
    reactions,
    activeTab,
    reactors,
    reactorsFetchState,
    reactorsHasMore,
    setActiveTab,
    fetchReactors,
    fetchNextReactors,
    removeReactor,
  } = useCometChatReactions({
    message,
    reactionsRequestBuilder,
    onError,
  });

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

  const handleReactorClick = useCallback(
    (reaction: CometChat.Reaction) => {
      onReactorClick?.(reaction, message);
    },
    [onReactorClick, message]
  );

  const contextValue = useMemo(
    () => ({
      message,
      reactions,
      alignment,
      maxVisible,
      visibleReactions,
      overflowCount,
      activeTab,
      reactors,
      reactorsFetchState,
      reactorsHasMore,
      onReactionClick: handleReactionClick,
      onReactorClick: handleReactorClick,
      setActiveTab,
      fetchReactors,
      fetchNextReactors,
      removeReactor,
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
      activeTab,
      reactors,
      reactorsFetchState,
      reactorsHasMore,
      handleReactionClick,
      handleReactorClick,
      setActiveTab,
      fetchReactors,
      fetchNextReactors,
      removeReactor,
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
