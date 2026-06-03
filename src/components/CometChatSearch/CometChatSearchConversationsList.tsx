import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSearchContext } from './CometChatSearch.context';
import { useCometChatSearchConversations } from './useCometChatSearchConversations';
import { CometChatConversationsItem } from '../CometChatConversations/CometChatConversationsItem';
import { CometChatLocalize } from '../../resources/CometChatLocalize/CometChatLocalize';
import type { CometChatSearchConversationsListProps } from './CometChatSearch.types';
import './CometChatSearch.css';

function getLocalizedString(key: string): string {
  const instance = CometChatLocalize.getSharedInstance();
  if (instance) {
    const result = instance.t(key);
    return result && result !== key ? result : key;
  }
  return key;
}

/**
 * CometChatSearchConversationsList — Renders conversation search results.
 *
 * Reads search state from CometChatSearchContext and renders a list of
 * conversation items with optional "See More" pagination.
 */
export const CometChatSearchConversationsList: React.FC<CometChatSearchConversationsListProps> = ({
  hideSection: hideSectionProp,
  suppressEmptyErrorView: suppressProp,
  useScrollPagination: useScrollPaginationProp,
}) => {
  const ctx = useCometChatSearchContext();

  const hideSection = hideSectionProp ?? ctx.hideConversationsSection;
  const suppressEmptyErrorView = suppressProp ?? ctx.bothScopesActive;
  const derivedScrollPagination = !!ctx.uid || !!ctx.guid || ctx.activeFilters.length > 0;
  const useScrollPagination = useScrollPaginationProp ?? derivedScrollPagination;

  const { conversations, fetchState, hasMore, loadMore } = useCometChatSearchConversations({
    searchKeyword: ctx.searchText,
    activeFilters: ctx.activeFilters,
    conversationsRequestBuilder: ctx.conversationsRequestBuilder,
    onError: ctx.handleError,
    onStateChange: ctx.handleConversationsStateChange,
  });

  // Sentinel ref for IntersectionObserver-based infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Ref for the scrollable container (used as IntersectionObserver root)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!useScrollPagination || !sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && fetchState !== 'loading') {
          void loadMore();
        }
      },
      { root: scrollContainerRef.current, rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [useScrollPagination, hasMore, fetchState, loadMore]);

  const handleItemClick = useCallback(
    (conversation: CometChat.Conversation) => {
      ctx.handleConversationClick({ conversation, searchKeyword: ctx.searchText });
    },
    [ctx]
  );

  if (hideSection) return null;

  return (
    <div
      ref={useScrollPagination ? scrollContainerRef : undefined}
      className={[
        'cometchat-search__conversations',
        useScrollPagination ? 'cometchat-search__conversations--full' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={getLocalizedString('search_conversation_header')}
    >
      <h3 className={'cometchat-search__conversations-header'}>
        {getLocalizedString('search_conversation_header')}
      </h3>

      {/* Loading shimmer */}
      {fetchState === 'loading' &&
        (ctx.loadingView ?? (
          <div className={'cometchat-search__shimmer'} aria-live="polite">
            {[1, 2, 3].map(i => (
              <div key={i} className={'cometchat-search__shimmer-item'}>
                <div className={'cometchat-search__shimmer-item-avatar'} />
                <div className={'cometchat-search__shimmer-item-body'}>
                  <div className={'cometchat-search__shimmer-item-body-title-wrapper'}>
                    <div className={'cometchat-search__shimmer-item-body-title'} />
                    <div className={'cometchat-search__shimmer-item-body-tail'} />
                  </div>
                  <div className={'cometchat-search__shimmer-item-body-subtitle'} />
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* Empty state */}
      {fetchState === 'empty' &&
        !suppressEmptyErrorView &&
        (ctx.emptyView ?? (
          <div className={'cometchat-search__section-empty-view'} aria-live="assertive">
            <div className={'cometchat-search__section-empty-view-icon'} />
            <div className={'cometchat-search__section-state-body'}>
              <div className={'cometchat-search__section-state-title'}>
                {getLocalizedString('search_no_result_title')}
              </div>
              <div className={'cometchat-search__section-state-description'}>
                {getLocalizedString('search_no_result_subtitle')}
              </div>
            </div>
          </div>
        ))}

      {/* Error state */}
      {fetchState === 'error' &&
        !suppressEmptyErrorView &&
        (ctx.errorView ?? (
          <div className={'cometchat-search__section-error-view'} aria-live="assertive">
            <div className={'cometchat-search__section-error-view-icon'} />
            <div className={'cometchat-search__section-state-body'}>
              <div className={'cometchat-search__section-state-title'}>
                {getLocalizedString('search_error_title')}
              </div>
              <div className={'cometchat-search__section-state-description'}>
                {getLocalizedString('search_error_subtitle')}
              </div>
            </div>
          </div>
        ))}

      {/* Results */}
      {fetchState === 'loaded' && (
        <>
          <div className={'cometchat-search__conversations-list'} role="list">
            {conversations.map(conversation => (
              <div
                key={conversation.getConversationId()}
                className={'cometchat-search__conversations-list-item'}
                role="listitem"
                data-testid={`search-conversation-item-${conversation.getConversationId()}`}
                onClick={() => {
                  handleItemClick(conversation);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(conversation);
                  }
                }}
                tabIndex={0}
              >
                {ctx.conversationItemView ? (
                  ctx.conversationItemView(conversation)
                ) : (
                  <CometChatConversationsItem
                    conversation={conversation}
                    hideUserStatus={ctx.hideUserStatus}
                    hideReceipts={ctx.hideReceipts}
                    hideDeleteButton={true}
                    options={ctx.conversationOptions}
                    leadingView={ctx.conversationLeadingView?.(conversation)}
                    titleView={ctx.conversationTitleView?.(conversation)}
                    subtitleView={ctx.conversationSubtitleView?.(conversation)}
                    trailingView={ctx.conversationTrailingView?.(conversation)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* See More button (non-scroll mode) */}
          {!useScrollPagination && hasMore && (
            <button
              type="button"
              className={'cometchat-search__conversations-see-more'}
              data-testid="search-conversations-see-more"
              onClick={() => void loadMore()}
            >
              {getLocalizedString('search_result_see_more')}
            </button>
          )}

          {/* Sentinel for scroll-based pagination */}
          {useScrollPagination && hasMore && (
            <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
          )}
        </>
      )}
    </div>
  );
};

CometChatSearchConversationsList.displayName = 'CometChatSearch.ConversationsList';
