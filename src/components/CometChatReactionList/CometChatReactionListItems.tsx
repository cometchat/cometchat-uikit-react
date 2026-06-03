import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatReactionListItemsProps } from './CometChatReactionList.types';
import { useCometChatReactionListContext } from './CometChatReactionList.context';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatAvatar } from '../base/CometChatAvatar';
import './CometChatReactionList.css';

/**
 * CometChatReactionList.Items — scrollable list of users who reacted.
 *
 * - Shows avatar, name (or "You" for current user), hint text, and emoji
 * - Current user items are clickable (to remove reaction)
 * - Non-current-user items are read-only
 * - IntersectionObserver sentinel at bottom for pagination
 * - Shows loading spinner at bottom when fetching more
 */
export const CometChatReactionListItems: React.FC<CometChatReactionListItemsProps> = ({
  className,
}) => {
  const {
    filteredReactions,
    fetchState,
    hasMore,
    isFetching,
    fetchMore,
    handleItemClick,
    isCurrentUser,
    selectedEmoji,
  } = useCometChatReactionListContext();
  const { getLocalizedString } = useLocale();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const youText = getLocalizedString('reaction_list_you') || 'You';
  const clickToRemoveText =
    getLocalizedString('reaction_list_click_to_remove') || 'Click to remove';

  // IntersectionObserver for pagination
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      entries => {
        // entries[0] is always defined in IntersectionObserver callbacks
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const entry = entries[0]!;
        if (entry.isIntersecting) {
          void fetchMore();
        }
      },
      { rootMargin: '50px' }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetching, fetchMore]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, reaction: CometChat.Reaction) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleItemClick(reaction);
      }
    },
    [handleItemClick]
  );

  // Don't render the list container during loading/error/empty states
  if (fetchState === 'loading' || fetchState === 'error' || fetchState === 'empty') return null;

  const rootClass = ['cometchat-reaction-list__list', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="list"
      aria-label={
        selectedEmoji ? `Users who reacted with ${selectedEmoji}` : 'All users who reacted'
      }
    >
      {filteredReactions.map(reaction => {
        const reactedBy = reaction.getReactedBy();
        const uid = reactedBy.getUid();
        const name = reactedBy.getName();
        const avatar = reactedBy.getAvatar();
        const emoji = reaction.getReaction();
        const isMine = isCurrentUser(reaction);
        const displayName = isMine ? youText : name;

        const itemClass = [
          'cometchat-reaction-list__list-item',
          isMine
            ? 'cometchat-reaction-list__list-item--current-user'
            : 'cometchat-reaction-list__list-item--readonly',
        ]
          .filter(Boolean)
          .join(' ');

        const ariaLabel = isMine
          ? `${displayName} reacted with ${emoji}. ${clickToRemoveText}`
          : `${name} reacted with ${emoji}`;

        return (
          <div
            key={`${uid}-${emoji}`}
            className={itemClass}
            role="listitem"
            tabIndex={isMine ? 0 : -1}
            aria-label={ariaLabel}
            onClick={
              isMine
                ? () => {
                    handleItemClick(reaction);
                  }
                : undefined
            }
            onKeyDown={
              isMine
                ? e => {
                    handleKeyDown(e, reaction);
                  }
                : undefined
            }
          >
            <div className={'cometchat-reaction-list__item-avatar'}>
              <CometChatAvatar.Root name={name} image={avatar}>
                <CometChatAvatar.Image />
                <CometChatAvatar.Initials />
              </CometChatAvatar.Root>
            </div>
            <div className={'cometchat-reaction-list__item-info'}>
              <span className={'cometchat-reaction-list__item-name'}>{displayName}</span>
              {isMine && (
                <span className={'cometchat-reaction-list__item-hint'}>{clickToRemoveText}</span>
              )}
            </div>
            <span className={'cometchat-reaction-list__item-emoji'} aria-hidden="true">
              {emoji}
            </span>
          </div>
        );
      })}

      {/* Loading more spinner */}
      {isFetching && filteredReactions.length > 0 && (
        <div className={'cometchat-reaction-list__loading-more'} aria-hidden="true">
          <div className={'cometchat-reaction-list__spinner'} />
        </div>
      )}

      {/* Sentinel for IntersectionObserver */}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />}
    </div>
  );
};
