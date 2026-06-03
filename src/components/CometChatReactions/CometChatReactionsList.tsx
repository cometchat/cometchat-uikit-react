import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatReactionsListProps } from './CometChatReactions.types';
import { useCometChatReactionsContext } from './CometChatReactions.context';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatListItem } from '../base/CometChatListItem';
import { CometChatAvatar } from '../base/CometChatAvatar';
import './CometChatReactions.css';

/**
 * CometChatReactionsList — full reactor list with tab filtering.
 *
 * Shows tabs for "All" + each emoji. Each tab displays a paginated
 * list of users who reacted, with avatar, name, and the emoji.
 */
export const CometChatReactionsList: React.FC<CometChatReactionsListProps> = ({ className }) => {
  const {
    reactions,
    activeTab,
    reactors,
    reactorsFetchState,
    reactorsHasMore,
    setActiveTab,
    fetchReactors,
    fetchNextReactors,
    onReactorClick,
    onReactionClick,
    removeReactor,
  } = useCometChatReactionsContext();
  const { getLocalizedString } = useLocale();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const allTabRef = useRef<HTMLButtonElement>(null);
  const loggedInUserUidRef = useRef<string>('');

  // Get logged-in user UID for identifying own reactions
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(user => {
        if (user) {
          loggedInUserUidRef.current = user.getUid();
        }
      })
      .catch(() => {
        // Silently ignore
      });
  }, []);

  const allText = getLocalizedString('reaction_list_all') || 'All';
  const errorText =
    getLocalizedString('reaction_list_error') ||
    'Looks like something went wrong. Please try again.';
  const youText = getLocalizedString('reaction_popup_you') || 'You';
  const tapToRemoveText = getLocalizedString('reaction_list_click_to_remove') || 'Tap to remove';

  // Total reaction count across all emojis
  const totalCount = reactions.reduce((acc, r) => acc + r.getCount(), 0);

  // Build tab data — memoized to avoid re-creating on every render
  const tabs = useMemo(
    () => [
      { id: 'all', label: allText, count: totalCount },
      ...reactions.map(r => ({
        id: r.getReaction(),
        label: r.getReaction(),
        count: r.getCount(),
      })),
    ],
    [allText, totalCount, reactions]
  );

  // Fetch reactors when tab changes
  useEffect(() => {
    void fetchReactors();
  }, [activeTab, fetchReactors]);

  // IntersectionObserver for pagination
  useEffect(() => {
    if (!sentinelRef.current || !reactorsHasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && reactorsFetchState !== 'loading') {
          void fetchNextReactors();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [reactorsHasMore, reactorsFetchState, fetchNextReactors]);

  // Keyboard navigation for tabs
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, tabIndex: number) => {
      let nextIndex = tabIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (tabIndex + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        nextIndex = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
        e.preventDefault();
      } else {
        return;
      }
      setActiveTab(tabs[nextIndex].id);
      // Focus the new tab
      if (listRef.current) {
        const tabElements = listRef.current.querySelectorAll<HTMLElement>('[role="tab"]');
        tabElements[nextIndex]?.focus();
      }
    },
    [tabs, setActiveTab]
  );

  const listClass = ['cometchat-reactions__list', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      className={listClass}
      role="dialog"
      aria-modal="true"
      aria-label={getLocalizedString('accessibility_reaction_details')}
    >
      {/* Tabs — always show when there are reactions */}
      {reactions.length > 0 && (
        <div
          className={'cometchat-reactions__list-tabs'}
          role="tablist"
          aria-label={getLocalizedString('accessibility_reaction_filters')}
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const tabClass = [
              'cometchat-reactions__list-tabs-tab',
              isActive ? 'cometchat-reactions__list-tabs-tab--active' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={tab.id}
                ref={tab.id === 'all' ? allTabRef : undefined}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={tabClass}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                onKeyDown={e => {
                  handleTabKeyDown(e, index);
                }}
              >
                <span
                  className={[
                    'cometchat-reactions__list-tabs-tab-emoji',
                    isActive ? 'cometchat-reactions__list-tabs-tab-emoji--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {tab.label}
                </span>
                <span
                  className={[
                    'cometchat-reactions__list-tabs-tab-count',
                    isActive ? 'cometchat-reactions__list-tabs-tab-count--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {reactorsFetchState === 'idle' ||
      (reactorsFetchState === 'loading' && reactors.length === 0) ? (
        <div className={'cometchat-reactions__list-shimmer'}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={'cometchat-reactions__list-shimmer-item'}>
              <div className={'cometchat-reactions__list-shimmer-item-icon'} />
              <div className={'cometchat-reactions__list-shimmer-item-content'} />
              <div className={'cometchat-reactions__list-shimmer-item-tailview'} />
            </div>
          ))}
        </div>
      ) : reactorsFetchState === 'error' ? (
        <div className={'cometchat-reactions__list-error'}>{errorText}</div>
      ) : (
        <div
          ref={listRef}
          className={'cometchat-reactions__list-items'}
          role="tabpanel"
          aria-label={getLocalizedString('accessibility_reactors_for').replace(
            '{tab}',
            activeTab === 'all' ? 'all reactions' : activeTab
          )}
        >
          {reactors.map(reactor => {
            const reactedBy = reactor.getReactedBy();
            const name = reactedBy.getName();
            const avatar = reactedBy.getAvatar();
            const reactionEmoji = reactor.getReaction();
            const isOwnReaction = reactedBy.getUid() === loggedInUserUidRef.current;
            const displayName = isOwnReaction ? youText : name;

            return (
              <div
                key={`${reactedBy.getUid()}-${reactionEmoji}`}
                className={'cometchat-reactions__list-item'}
                style={isOwnReaction ? { cursor: 'pointer' } : { cursor: 'default' }}
              >
                <CometChatListItem.Root
                  onItemClick={
                    isOwnReaction
                      ? () => {
                          // Optimistically remove from the list
                          removeReactor(reactedBy.getUid(), reactionEmoji);
                          // Fire the SDK toggle to actually remove
                          onReactionClick(reactionEmoji);
                          onReactorClick(reactor);
                        }
                      : undefined
                  }
                >
                  <CometChatListItem.LeadingView>
                    <CometChatAvatar.Root name={name} image={avatar}>
                      <CometChatAvatar.Image />
                      <CometChatAvatar.Initials />
                    </CometChatAvatar.Root>
                  </CometChatListItem.LeadingView>
                  <CometChatListItem.Title>{displayName}</CometChatListItem.Title>
                  {isOwnReaction && (
                    <CometChatListItem.Subtitle>{tapToRemoveText}</CometChatListItem.Subtitle>
                  )}
                  <CometChatListItem.TrailingView>
                    <span>{reactionEmoji}</span>
                  </CometChatListItem.TrailingView>
                </CometChatListItem.Root>
              </div>
            );
          })}
          {/* Sentinel for infinite scroll */}
          {reactorsHasMore && <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />}
        </div>
      )}
    </div>
  );
};
