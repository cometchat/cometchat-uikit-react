import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSearchContext } from './CometChatSearch.context';
import { useCometChatSearchMessages } from './useCometChatSearchMessages';
import { CometChatLocalize } from '../../resources/CometChatLocalize/CometChatLocalize';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import type { CometChatSearchMessagesListProps } from './CometChatSearch.types';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { getMessageSubtitle as buildMessageSubtitle } from '../../utils/messageSubtitle';
import { applyDisplayFormatters } from '../../formatters/applyDisplayFormatters';
import './CometChatSearch.css';

// File type icons
import fileIcon from '../../assets/document-file-icon.svg';
import './CometChatSearch.css';

function getLocalizedString(key: string): string {
  const instance = CometChatLocalize.getSharedInstance();
  if (instance) {
    const result = instance.t(key);
    return result && result !== key ? result : key;
  }
  return key;
}

// ── Helpers ──

function getMessageTitle(message: CometChat.BaseMessage, uid?: string, guid?: string): string {
  if (uid || guid) {
    return message.getSender().getName();
  }
  const receiver = message.getReceiver();
  return receiver.getName();
}

/**
 * Thin adapter over the shared preview builder. Search prepends the sender only
 * for unscoped results — inside a single conversation the sender is already the
 * list title.
 */
function getMessageSubtitle(
  message: CometChat.BaseMessage,
  loggedInUserId: string | undefined,
  uid?: string,
  guid?: string
): string {
  return buildMessageSubtitle(message, {
    loggedInUserId,
    iconClassPrefix: 'cometchat-search__messages-subtitle-icon',
    includeSenderPrefix: !uid && !guid,
    youLabel: getLocalizedString('search_message_subtitle_you'),
    t: getLocalizedString,
  });
}

function shouldShowDateSeparator(messages: CometChat.BaseMessage[], index: number): boolean {
  if (index === 0) return true;
  const current = messages[index]?.getSentAt();
  const previous = messages[index - 1]?.getSentAt();
  if (current === undefined || previous === undefined) return false;
  const d1 = new Date(current * 1000);
  const d2 = new Date(previous * 1000);
  return d1.getMonth() !== d2.getMonth() || d1.getFullYear() !== d2.getFullYear();
}

function formatMonthYear(sentAt: number): string {
  const date = new Date(sentAt * 1000);
  const locale = CometChatLocalize.getSharedInstance()?.getDateLocaleLanguage() ?? 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function formatDate(sentAt: number): string {
  const date = new Date(sentAt * 1000);
  const locale = CometChatLocalize.getSharedInstance()?.getDateLocaleLanguage() ?? 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

type LeadingViewType = 'audio' | 'file' | 'link' | 'none';
type TrailingViewType = 'image' | 'video' | 'date';

function getLeadingViewType(message: CometChat.BaseMessage): LeadingViewType {
  const type = message.getType();
  if (type === 'audio') return 'audio';
  if (type === 'file') return 'file';
  if (type === 'text') {
    const metadata = (message as CometChat.TextMessage).getMetadata() as
      | Record<string, unknown>
      | undefined;
    const injected = metadata?.['@injected'] as Record<string, unknown> | undefined;
    const ext = injected?.extensions as Record<string, unknown> | undefined;
    const lp = ext?.['link-preview'] as Record<string, unknown> | undefined;
    const links = lp?.links as unknown[] | undefined;
    if (links && links.length > 0) return 'link';
    const text = (message as CometChat.TextMessage).getText();
    if (/^https?:\/\//.test(text.trim()) || /\bhttps?:\/\/\S+/i.test(text)) return 'link';
  }
  return 'none';
}

function getTrailingViewType(message: CometChat.BaseMessage): TrailingViewType {
  const type = message.getType();
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  return 'date';
}

function getLinkFavicon(message: CometChat.BaseMessage): string | null {
  try {
    const metadata = (message as CometChat.TextMessage).getMetadata() as
      | Record<string, unknown>
      | undefined;
    const injected = metadata?.['@injected'] as Record<string, unknown> | undefined;
    const ext = injected?.extensions as Record<string, unknown> | undefined;
    const lp = ext?.['link-preview'] as Record<string, unknown> | undefined;
    const links = lp?.links as Record<string, string>[] | undefined;
    return links?.[0]?.favicon ?? null;
  } catch {
    return null;
  }
}

function getFileTypeIcon(): string {
  return fileIcon;
}

// ── Component ──

/**
 * CometChatSearchMessagesList — Renders message search results.
 *
 * Reads search state from CometChatSearchContext and renders a list of
 * message items with type-specific leading/trailing views and date separators.
 */
export const CometChatSearchMessagesList: React.FC<CometChatSearchMessagesListProps> = ({
  hideSection: hideSectionProp,
  suppressEmptyErrorView: suppressProp,
  alwaysShowSeeMore: alwaysShowSeeMoreProp,
}) => {
  const ctx = useCometChatSearchContext();

  const hideSection = hideSectionProp ?? ctx.hideMessagesSection;
  const suppressEmptyErrorView = suppressProp ?? ctx.bothScopesActive;
  const derivedAlwaysShowSeeMore = !ctx.uid && !ctx.guid && ctx.activeFilters.length === 0;
  const alwaysShowSeeMore = alwaysShowSeeMoreProp ?? derivedAlwaysShowSeeMore;
  const useScrollPagination = !alwaysShowSeeMore || ctx.activeFilters.length > 0;

  const { messages, fetchState, hasMore, loadMore } = useCometChatSearchMessages({
    searchKeyword: ctx.searchText,
    activeFilters: ctx.activeFilters,
    uid: ctx.uid,
    guid: ctx.guid,
    alwaysShowSeeMore,
    messagesRequestBuilder: ctx.messagesRequestBuilder,
    messageSentAtDateTimeFormat: ctx.messageSentAtDateTimeFormat,
    onError: ctx.handleError,
    onStateChange: ctx.handleMessagesStateChange,
  });

  // Sentinel ref for IntersectionObserver-based infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
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
    (message: CometChat.BaseMessage) => {
      ctx.handleMessageClick({ message, searchKeyword: ctx.searchText });
    },
    [ctx]
  );

  if (hideSection) return null;

  return (
    <div
      ref={useScrollPagination ? scrollContainerRef : undefined}
      className={[
        'cometchat-search__messages',
        useScrollPagination || ctx.activeFilters.length > 0
          ? 'cometchat-search__messages--full'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={getLocalizedString('search_messages_header')}
    >
      <h3 className={'cometchat-search__messages-header'}>
        {getLocalizedString('search_messages_header')}
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
          <div className={'cometchat-search__messages-list'} role="list">
            {messages.map((message, index) => (
              <React.Fragment key={message.getId()}>
                {/* Date separator */}
                {shouldShowDateSeparator(messages, index) && (
                  <div className={'cometchat-search__messages-date-separator'}>
                    {formatMonthYear(message.getSentAt())}
                  </div>
                )}

                {/* Message item */}
                {ctx.messageItemView ? (
                  ctx.messageItemView(message)
                ) : (
                  <div
                    className={'cometchat-search__messages-list-item'}
                    role="listitem"
                    tabIndex={0}
                    data-testid={`search-message-item-${String(message.getId())}`}
                    onClick={() => {
                      handleItemClick(message);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(message);
                      }
                    }}
                  >
                    {/* Leading view */}
                    {ctx.messageLeadingView
                      ? ctx.messageLeadingView(message)
                      : (() => {
                          const leadingType = getLeadingViewType(message);
                          if (leadingType === 'audio') {
                            return (
                              <div
                                className={[
                                  'cometchat-search__messages-leading-view',
                                  'cometchat-search__messages-leading-view--audio',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <div className={'cometchat-search__messages-leading-view-icon'} />
                              </div>
                            );
                          }
                          if (leadingType === 'file') {
                            return (
                              <div
                                className={[
                                  'cometchat-search__messages-leading-view',
                                  'cometchat-search__messages-leading-view--file',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <img
                                  src={getFileTypeIcon()}
                                  className={'cometchat-search__messages-leading-view-file-icon'}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                            );
                          }
                          if (leadingType === 'link') {
                            const favicon = getLinkFavicon(message);
                            return (
                              <div
                                className={[
                                  'cometchat-search__messages-leading-view',
                                  'cometchat-search__messages-leading-view--link',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {favicon ? (
                                  <img
                                    src={favicon}
                                    className={'cometchat-search__messages-leading-view-link-img'}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <div className={'cometchat-search__messages-leading-view-icon'} />
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}

                    {/* Body */}
                    <div className={'cometchat-search__messages-list-item-body'}>
                      <div className={'cometchat-search__messages-list-item-title'}>
                        {ctx.messageTitleView
                          ? ctx.messageTitleView(message)
                          : getMessageTitle(message, ctx.uid, ctx.guid)}
                      </div>
                      <div className={'cometchat-search__messages-list-item-subtitle'}>
                        {ctx.messageSubtitleView
                          ? ctx.messageSubtitleView(message)
                          : (() => {
                              const hasThread = !!message.getParentMessageId();
                              const subtitleHtml = sanitizeHtml(
                                applyDisplayFormatters(
                                  getMessageSubtitle(
                                    message,
                                    CometChatUIKit.getLoggedInUser()?.getUid(),
                                    ctx.uid,
                                    ctx.guid
                                  ),
                                  ctx.textFormatters
                                )
                              );
                              return (
                                <>
                                  {hasThread && (
                                    <span
                                      className={'cometchat-search__messages-subtitle-icon-thread'}
                                      aria-label={getLocalizedString('thread_reply')}
                                    />
                                  )}
                                  <span
                                    className="cometchat-search__messages-list-item-subtitle-content"
                                    dangerouslySetInnerHTML={{ __html: subtitleHtml }}
                                  />
                                </>
                              );
                            })()}
                      </div>
                    </div>

                    {/* Trailing view */}
                    {ctx.messageTrailingView
                      ? ctx.messageTrailingView(message)
                      : (() => {
                          const trailingType = getTrailingViewType(message);
                          if (trailingType === 'image') {
                            const media = message as CometChat.MediaMessage;
                            const attachments = media.getAttachments();
                            const count = attachments.length;
                            const url = attachments[0]?.getUrl() ?? '';
                            const overflow = count > 1 ? count - 1 : 0;
                            return (
                              <div className={'cometchat-search__messages-trailing-view'}>
                                {url && (
                                  <img
                                    src={url}
                                    alt={`Image from ${message.getSender().getName()}`}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                )}
                                {overflow > 0 && (
                                  <div className={'cometchat-search__messages-trailing-overlay'}>
                                    +{overflow}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          if (trailingType === 'video') {
                            const media = message as CometChat.MediaMessage;
                            const attachments = media.getAttachments();
                            const count = attachments.length;
                            const overflow = count > 1 ? count - 1 : 0;
                            // Try thumbnail from metadata
                            let thumbnail = '';
                            try {
                              const meta = media.getMetadata() as Record<string, unknown> | null;
                              const injected = meta?.['@injected'] as
                                | Record<string, unknown>
                                | undefined;
                              const ext = injected?.extensions as
                                | Record<string, unknown>
                                | undefined;
                              const thumbGen = ext?.['thumbnail-generation'] as
                                | Record<string, unknown>
                                | undefined;
                              const thumbUrl = thumbGen?.url_medium;
                              if (typeof thumbUrl === 'string') thumbnail = thumbUrl;
                            } catch {
                              /* ignore */
                            }
                            return (
                              <div
                                className={[
                                  'cometchat-search__messages-trailing-view',
                                  'cometchat-search__messages-trailing-view--video',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {thumbnail ? (
                                  <img src={thumbnail} alt="" loading="lazy" decoding="async" />
                                ) : null}
                                {overflow > 0 ? (
                                  <div className={'cometchat-search__messages-trailing-overlay'}>
                                    +{overflow}
                                  </div>
                                ) : (
                                  <div className={'cometchat-search__messages-video-play-button'} />
                                )}
                              </div>
                            );
                          }
                          return (
                            <div className={'cometchat-search__messages-trailing-view--date'}>
                              {formatDate(message.getSentAt())}
                            </div>
                          );
                        })()}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* See More button (non-scroll mode) */}
          {!useScrollPagination && hasMore && (
            <button
              type="button"
              className={'cometchat-search__messages-see-more'}
              data-testid="search-messages-see-more"
              onClick={() => void loadMore()}
            >
              {getLocalizedString('search_result_see_more')}
            </button>
          )}

          {/* Sentinel for scroll-based pagination */}
          {useScrollPagination && hasMore && (
            <div
              className="bottom-sentinel"
              ref={sentinelRef}
              aria-hidden="true"
              style={{ height: 1 }}
            />
          )}
        </>
      )}
    </div>
  );
};

CometChatSearchMessagesList.displayName = 'CometChatSearch.MessagesList';
