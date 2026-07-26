import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSearchContext } from './CometChatSearch.context';
import { useCometChatSearchMessages } from './useCometChatSearchMessages';
import { CometChatLocalize } from '../../resources/CometChatLocalize/CometChatLocalize';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import type { CometChatSearchMessagesListProps } from './CometChatSearch.types';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
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

function getMessageSubtitle(
  message: CometChat.BaseMessage,
  loggedInUserId: string | undefined,
  uid?: string,
  guid?: string
): string {
  const type = message.getType();
  let text = '';

  if (type === 'text') {
    const textMsg = message as CometChat.TextMessage;
    // Check for rich text HTML in metadata (sent by rich text editor)
    try {
      const metadata = textMsg.getMetadata() as Record<string, unknown> | undefined;
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      if (richText?.html && richText.hasFormatting) {
        text = richText.html;
      } else {
        text = textMsg.getText();
      }
    } catch {
      text = textMsg.getText();
    }

    // Step 1: Convert HTML formatting tags to markdown equivalents
    // <b>text</b> → **text**, <i>text</i> → _text_, <u>text</u> preserved, <s>text</s> → ~~text~~
    text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
    text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '_$1_');
    text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '_$1_');
    text = text.replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~');
    text = text.replace(/<strike>([\s\S]*?)<\/strike>/gi, '~~$1~~');
    text = text.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~');

    // Step 2: escape (don't drop) remaining HTML tags so payloads render as inert text;
    // preserve mention pseudo-tags and <u>. Output is also sanitized at the render sink.
    text = text.replace(/<[^>]*>/g, match => {
      const inner = match.slice(1, -1).trim();
      if (/^\/?u$/i.test(inner)) return match; // preserve <u> and </u>
      if (inner.startsWith('@')) return match; // preserve <@uid:...> mentions
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });

    // Step 3: Convert markdown to HTML for display
    // Bold: **text** → <b>text</b>
    text = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    // Underline: __text__ or <u>text</u> (already preserved)
    text = text.replace(/__([^_]+)__/g, '<u>$1</u>');
    // Italic: _text_ → <i>text</i>
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');
    // Strikethrough: ~~text~~ → <s>text</s>
    text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>');
    // Inline code: `text` → <code>text</code>
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Strip links: [text](url) → text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Strip blockquotes: > text → text
    text = text.replace(/^(?:&gt;|>)\s?/gm, '');

    // Step 4: Mentions <@uid:xxx> → styled @displayName, <@all:label> → styled @label
    const mentionedUsers =
      (
        message as unknown as {
          getMentionedUsers?: () => { getUid: () => string; getName: () => string }[];
        }
      ).getMentionedUsers?.() ?? [];
    const mentionMap = new Map<string, string>();
    for (const user of mentionedUsers) {
      mentionMap.set(user.getUid(), user.getName());
    }
    text = text.replace(/<@uid:([^>]+)>/g, (_match, uid: string) => {
      const name = mentionMap.get(uid);
      const displayName = name ?? uid;
      return `<span class="cometchat-mentions cometchat-mentions-other"><span>@${displayName}</span></span>`;
    });
    text = text.replace(/<@all:([^>]+)>/g, (_match, label: string) => {
      return `<span class="cometchat-mentions cometchat-mentions-you"><span>@${label}</span></span>`;
    });

    // Step 5: Collapse whitespace and newlines
    text = text.replace(/\n/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
  } else if (type === 'image' || type === 'video' || type === 'audio' || type === 'file') {
    const media = message as CometChat.MediaMessage;
    const attachments = media.getAttachments();
    const count = Math.max(attachments.length, 1);
    const caption = typeof media.getCaption === 'function' ? media.getCaption() || '' : '';
    const iconSpan = `<span class="cometchat-search__messages-subtitle-icon cometchat-search__messages-subtitle-icon--${type}"></span>`;

    // Format caption with rich text if present
    let formattedCaption = '';
    if (caption.trim()) {
      formattedCaption = caption;
      formattedCaption = formattedCaption.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      formattedCaption = formattedCaption.replace(/__([^_]+)__/g, '<u>$1</u>');
      formattedCaption = formattedCaption.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');
      formattedCaption = formattedCaption.replace(/~~([^~]+)~~/g, '<s>$1</s>');
      formattedCaption = formattedCaption.replace(/`([^`]+)`/g, '<code>$1</code>');
      formattedCaption = formattedCaption.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      formattedCaption = formattedCaption.replace(/^(?:&gt;|>)\s?/gm, '');
      const mentionedUsers =
        (
          message as unknown as {
            getMentionedUsers?: () => { getUid: () => string; getName: () => string }[];
          }
        ).getMentionedUsers?.() ?? [];
      const mentionMap = new Map<string, string>();
      for (const user of mentionedUsers) {
        mentionMap.set(user.getUid(), user.getName());
      }
      formattedCaption = formattedCaption.replace(/<@uid:([^>]+)>/g, (_m, uid: string) => {
        const name = mentionMap.get(uid) ?? uid;
        return `<span class="cometchat-mentions cometchat-mentions-other"><span>@${name}</span></span>`;
      });
      formattedCaption = formattedCaption.replace(/<@all:([^>]+)>/g, (_m, lbl: string) => {
        return `<span class="cometchat-mentions cometchat-mentions-you"><span>@${lbl}</span></span>`;
      });
      formattedCaption = formattedCaption.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const hasCaption = formattedCaption.length > 0;
    const fileName = attachments[0]?.getName() ?? type;

    if (count === 1 && !hasCaption) {
      // Case 1: one attachment, no caption → just file name
      text = `${iconSpan}${fileName}`;
    } else if (count > 1 && !hasCaption) {
      // Case 2: multiple attachments, no caption → "N Files"
      const pluralKey = `media_edit_preview_${type}_plural`;
      const plural = getLocalizedString(pluralKey);
      const label =
        plural !== pluralKey
          ? `${String(count)} ${plural}`
          : `${String(count)} ${getLocalizedString(`conversation_subtitle_${type}`)}`;
      text = `${iconSpan}${label}`;
    } else if (count === 1 && hasCaption) {
      // Case 3: one attachment + caption → just caption (no file name or type label)
      text = `${iconSpan}${formattedCaption}`;
    } else {
      // Case 4: multiple attachments + caption
      if (type === 'image' || type === 'video') {
        // Images/videos: just caption (count visible via +N overlay on trailing view)
        text = `${iconSpan}${formattedCaption}`;
      } else {
        // Files/audios: "N Files · caption"
        const pluralKey = `media_edit_preview_${type}_plural`;
        const plural = getLocalizedString(pluralKey);
        const label =
          plural !== pluralKey
            ? `${String(count)} ${plural}`
            : `${String(count)} ${getLocalizedString(`conversation_subtitle_${type}`)}`;
        text = `${iconSpan}${label} · ${formattedCaption}`;
      }
    }
  } else {
    text = type;
  }

  // Prepend sender name for non-scoped search
  if (!uid && !guid) {
    const sender = message.getSender();
    const isMe = sender.getUid() === loggedInUserId;
    const localizedYou = getLocalizedString('search_message_subtitle_you');
    const senderName = isMe ? localizedYou : sender.getName();
    if (senderName) {
      text = `${senderName}: ${text}`;
    }
  }

  return text;
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
                                getMessageSubtitle(
                                  message,
                                  CometChatUIKit.getLoggedInUser()?.getUid(),
                                  ctx.uid,
                                  ctx.guid
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
