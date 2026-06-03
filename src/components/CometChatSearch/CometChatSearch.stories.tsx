/**
 * CometChatSearch Storybook Stories
 *
 * Every story uses a context mock so no SDK calls are made.
 * The actual component UI (header, filter bar, results, states) is rendered
 * by injecting CometChatSearchContext directly — same pattern as CometChatReactionList.
 *
 * Stories:
 *  - Default          — initial "Start Your Search" state, interactive input + filters
 *  - WithActiveFilter — one filter chip pre-selected (Unread)
 *  - LoadingState     — shimmer placeholders in both sections
 *  - EmptyState       — unified "No Results" view (both scopes empty)
 *  - ErrorState       — unified error view (both scopes errored)
 *  - ConversationsResults — loaded conversation results
 *  - MessagesResults      — loaded message results
 *  - BothResults          — conversations + messages side by side
 *  - ConversationsOnly    — searchIn=["conversations"]
 *  - MessagesOnly         — searchIn=["messages"]
 *  - NoBackButton         — hideBackButton=true
 *  - CustomInitialView    — custom initialView slot
 *  - CustomEmptyView      — custom emptyView slot
 *
 * @module components/CometChatSearch
 */

import React, { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatSearch } from './CometChatSearch';
import { CometChatSearchContext } from './CometChatSearch.context';
import type {
  CometChatSearchContextValue,
  CometChatSearchFilter,
  CometChatSearchScope,
} from './CometChatSearch.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationsItem } from '../CometChatConversations/CometChatConversationsItem';
import { CometChatConversationsContext } from '../CometChatConversations/CometChatConversations.context';
import type { CometChatConversationsContextValue } from '../CometChatConversations/CometChatConversations.types';
import {
  getAvailableFilters,
  getVisibleFilters,
  toggleFilter,
  shouldRenderConversations,
  shouldRenderMessages,
} from './CometChatSearchFilterUtils';
import './CometChatSearch.css';

// ============================================================
// Mock data helpers
// ============================================================

function mockUser(uid: string, name: string, avatar?: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar ?? `https://i.pravatar.cc/150?u=${uid}`,
    getStatus: () => 'online',
  } as unknown as CometChat.User;
}

function mockGroup(guid: string, name: string) {
  return {
    getGuid: () => guid,
    getName: () => name,
    getIcon: () => `https://i.pravatar.cc/150?u=${guid}`,
    getType: () => 'public',
    getMembersCount: () => 5,
  } as unknown as CometChat.Group;
}

// ── Sender / receiver pools (matches Angular mock-services.ts) ──

const SENDERS = [
  { uid: 'sender-0', name: 'Andrew Joseph' },
  { uid: 'sender-1', name: 'Nancy Grace' },
  { uid: 'sender-2', name: 'George Alan' },
  { uid: 'sender-3', name: 'Carol White' },
  { uid: 'sender-4', name: 'David Lee' },
];

const RECEIVERS = [
  { uid: 'recv-0', name: 'Andrew Joseph' },
  { uid: 'recv-1', name: 'Nancy Grace' },
  { uid: 'recv-2', name: 'George Alan' },
  { uid: 'recv-3', name: 'Design Team', isGroup: true },
  { uid: 'recv-4', name: 'Engineering', isGroup: true },
];

// ── Dynamic mock generators (keyword-aware, filter-aware) ──

/**
 * Generate mock conversations based on keyword and active filters.
 * Mirrors Angular's MockSearchConversationsService.search().
 */
function generateMockConversations(
  keyword: string,
  activeFilters: CometChatSearchFilter[]
): CometChat.Conversation[] {
  const kw = keyword || 'hello';
  const groupsOnly = activeFilters.includes('groups');
  const unreadOnly = activeFilters.includes('unread');

  const templates = [
    `Hey, ${kw} — are you free for a call?`,
    `I was just thinking about ${kw}`,
    `Did you see the ${kw} update?`,
    `Re: ${kw} — looks good to me`,
    `Quick question about ${kw}`,
  ];
  const names = ['Alice Johnson', 'Nancy Grace', 'Design Team', 'George Alan', 'Engineering'];

  return Array.from({ length: 5 }, (_, i) => {
    const isGroup = groupsOnly ? true : i >= 3;
    const unread = unreadOnly ? (i + 1) * 2 : i === 0 ? 3 : i === 2 ? 1 : 0;
    const id = `conv-${String(i)}`;
    const convWith = isGroup ? mockGroup(id, names[i]!) : mockUser(id, names[i]!);
    const sentAt = Math.floor(Date.now() / 1000) - i * 3600;
    return {
      getConversationId: () => id,
      getConversationType: () => (isGroup ? 'group' : 'user'),
      getConversationWith: () => convWith,
      getLastMessage: () => ({
        getType: () => 'text',
        getCategory: () => 'message',
        getText: () => templates[i]!,
        getSentAt: () => sentAt,
        getDeletedAt: () => null,
        getSender: () =>
          mockUser(SENDERS[i % SENDERS.length]!.uid, SENDERS[i % SENDERS.length]!.name),
        getDeliveredAt: () => sentAt,
        getReadAt: () => null,
        getId: () => i + 1,
      }),
      getUnreadMessageCount: () => unread,
    } as unknown as CometChat.Conversation;
  });
}

/**
 * Generate mock messages based on keyword and active filters.
 * Mirrors Angular's MockSearchMessagesService.search().
 */
function generateMockMessages(
  keyword: string,
  activeFilters: CometChatSearchFilter[]
): CometChat.BaseMessage[] {
  const kw = keyword || 'hello';

  // Determine message type from active filter
  type MsgType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'link' | 'mixed';
  let msgType: MsgType = 'text';
  if (activeFilters.includes('messages')) msgType = 'mixed';
  else if (activeFilters.includes('photos')) msgType = 'image';
  else if (activeFilters.includes('videos')) msgType = 'video';
  else if (activeFilters.includes('files')) msgType = 'file';
  else if (activeFilters.includes('audio')) msgType = 'audio';
  else if (activeFilters.includes('links')) msgType = 'link';

  const count = msgType === 'mixed' ? 8 : 5;
  const mixedTypes = ['text', 'text', 'image', 'text', 'file', 'audio', 'text', 'video'] as const;

  const textTemplates = [
    `Hey, ${kw} — are you available for a quick call?`,
    `I just pushed the ${kw} changes to the repo`,
    `${kw} screenshot attached`,
    `Let me know when you review the ${kw} PR`,
    `${kw} document shared`,
    `${kw} voice note`,
    `The ${kw} design looks great, shipping it tomorrow`,
    `${kw} recording`,
  ];
  const linkTemplates = [
    `Check out this ${kw} link: https://example.com/${kw}`,
    `Here's the ${kw} docs: https://docs.example.com/${kw}`,
    `Found this about ${kw}: https://blog.example.com/${kw}-guide`,
    `${kw} reference: https://wiki.example.com/${kw}`,
    `See https://example.com/${kw}-overview for details`,
  ];

  return Array.from({ length: count }, (_, i) => {
    const type: 'text' | 'image' | 'video' | 'audio' | 'file' =
      msgType === 'mixed' ? mixedTypes[i]! : msgType === 'link' ? 'text' : msgType;

    const sender = SENDERS[i % SENDERS.length]!;
    const receiver = RECEIVERS[(i + 1) % RECEIVERS.length]!;
    const sentAt = Math.floor(Date.now() / 1000) - i * 3600;

    const base = {
      getId: () => 100 + i,
      getType: () => type,
      getCategory: () => 'message',
      getSentAt: () => sentAt,
      getSender: () => mockUser(sender.uid, sender.name),
      getReceiver: () =>
        receiver.isGroup
          ? mockGroup(receiver.uid, receiver.name)
          : mockUser(receiver.uid, receiver.name),
      getDeletedAt: () => null,
      getMetadata: () => (msgType === 'link' ? { hasLinks: true } : null),
    };

    if (type === 'text') {
      return {
        ...base,
        getText: () =>
          msgType === 'link'
            ? linkTemplates[i % linkTemplates.length]!
            : textTemplates[i % textTemplates.length]!,
        getAttachments: () => [],
      } as unknown as CometChat.BaseMessage;
    }

    // Media messages
    const fileNames: Record<string, string> = {
      image: 'screenshot.png',
      video: 'recording.mp4',
      audio: 'voice-note.mp3',
      file: `document-${String(i + 1)}.pdf`,
    };
    const fileUrls: Record<string, string> = {
      image: `https://picsum.photos/seed/${kw}${String(i)}/200/150`,
      video: `https://picsum.photos/seed/video${kw}${String(i)}/200/150`,
      audio: '',
      file: '',
    };

    return {
      ...base,
      getAttachments: () => [
        {
          getName: () => fileNames[type] ?? type,
          getUrl: () => fileUrls[type] ?? '',
        },
      ],
    } as unknown as CometChat.BaseMessage;
  });
}

// ============================================================
// SearchShell — fully interactive, mirrors Angular exactly
// ============================================================

const FILTER_LABELS: Record<CometChatSearchFilter, string> = {
  audio: 'Audio',
  files: 'Documents',
  groups: 'Groups',
  links: 'Links',
  messages: 'Messages',
  conversations: 'Conversations',
  photos: 'Photos',
  unread: 'Unread',
  videos: 'Videos',
};

const DEFAULT_SEARCH_FILTERS: CometChatSearchFilter[] = [
  'audio',
  'files',
  'groups',
  'photos',
  'videos',
  'links',
  'unread',
];

/**
 * SearchShell — fully interactive search UI for storybook.
 *
 * Mirrors Angular's CometChatSearchComponent exactly:
 * - 500ms debounce: searchValue updates immediately, searchText after debounce
 * - Filter toggle uses real getVisibleFilters / shouldRenderConversations / shouldRenderMessages
 * - Conversation filters (Unread, Groups) show results immediately without text input
 * - When a conversation filter is active, only conversation filters remain visible
 * - Message filters (Photos, Videos, etc.) show message results
 */
const SearchShell: React.FC<{
  ctx?: Partial<CometChatSearchContextValue>;
  searchIn?: CometChatSearchScope[];
  searchFilters?: CometChatSearchFilter[];
  initialSearchFilter?: CometChatSearchFilter;
  defaultSearchText?: string;
}> = ({
  ctx: ctxOverrides = {},
  searchIn = [],
  searchFilters = DEFAULT_SEARCH_FILTERS,
  initialSearchFilter,
  defaultSearchText = '',
}) => {
  const [searchValue, setSearchValue] = useState(defaultSearchText);
  const [searchText, setSearchText] = useState(defaultSearchText);
  const [activeFilters, setActiveFilters] = useState<CometChatSearchFilter[]>(
    initialSearchFilter ? [initialSearchFilter] : []
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount (matches Angular's setTimeout focus)
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleInput = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchText(value.trim()), 500);
  };

  const handleClear = () => {
    setSearchValue('');
    setSearchText('');
    setActiveFilters([]);
    inputRef.current?.focus();
  };

  const handleToggleFilter = (filterId: CometChatSearchFilter) => {
    setActiveFilters(prev => toggleFilter(prev, filterId));
  };

  // Compute derived state using the real filter utils — identical to Angular
  const available = getAvailableFilters(searchIn, searchFilters);
  const visibleFilters = getVisibleFilters(
    available,
    activeFilters,
    undefined,
    undefined,
    searchIn
  );
  const showConversations = shouldRenderConversations(searchText, activeFilters, searchIn);
  const showMessages = shouldRenderMessages(searchText, activeFilters, searchIn);
  const showInitialView = searchText.trim() === '' && activeFilters.length === 0;
  const bothScopesActive = showConversations && showMessages;

  const liveCtx: CometChatSearchContextValue = {
    searchValue,
    searchText,
    activeFilters,
    visibleFilters,
    showInitialView,
    showConversations,
    showMessages,
    bothScopesActive,
    hideConversationsSection: false,
    hideMessagesSection: false,
    showUnifiedEmpty: false,
    showUnifiedError: false,
    conversationsState: 'loaded',
    messagesState: 'loaded',
    searchIn,
    searchFilters,
    uid: undefined,
    guid: undefined,
    hideBackButton: false,
    hideUserStatus: false,
    hideGroupType: false,
    hideReceipts: false,
    textFormatters: [],
    conversationsRequestBuilder: undefined,
    messagesRequestBuilder: undefined,
    initialView: undefined,
    loadingView: undefined,
    emptyView: undefined,
    errorView: undefined,
    conversationItemView: undefined,
    conversationLeadingView: undefined,
    conversationTitleView: undefined,
    conversationSubtitleView: undefined,
    conversationTrailingView: undefined,
    messageItemView: undefined,
    messageLeadingView: undefined,
    messageTitleView: undefined,
    messageSubtitleView: undefined,
    messageTrailingView: undefined,
    setSearchValue: handleInput,
    clearSearch: handleClear,
    toggleFilter: handleToggleFilter,
    isFilterActive: (id: CometChatSearchFilter) => activeFilters.includes(id),
    getFilterLabel: (id: CometChatSearchFilter) => FILTER_LABELS[id],
    handleBackClick: () => {},
    handleConversationClick: () => {},
    handleMessageClick: () => {},
    handleConversationsStateChange: () => {},
    handleMessagesStateChange: () => {},
    handleError: () => {},
    // Story-level overrides (callbacks, hideBackButton, custom views, etc.)
    ...ctxOverrides,
  };

  return (
    <CometChatSearchContext.Provider value={liveCtx}>
      <div
        className={['cometchat', 'cometchat-search'].filter(Boolean).join(' ')}
        role="search"
        aria-label="Search"
      >
        {/* Header */}
        <div className={'cometchat-search__header'}>
          {!liveCtx.hideBackButton && (
            <button
              type="button"
              className={'cometchat-search__back-button'}
              aria-label="Back"
              onClick={liveCtx.handleBackClick}
            >
              <span className={'cometchat-search__back-button-icon'} aria-hidden="true" />
            </button>
          )}
          <div className={'cometchat-search__search-bar'}>
            <div className={'cometchat-search__input'}>
              <input
                ref={inputRef}
                type="text"
                role="searchbox"
                value={searchValue}
                onChange={e => handleInput(e.target.value)}
                placeholder="Search"
                aria-label="Search"
                data-testid="search-input"
              />
              {(searchValue || activeFilters.length > 0) && (
                <button
                  type="button"
                  className={'cometchat-search__input-clear-button'}
                  aria-label="Clear search"
                  onClick={handleClear}
                >
                  <span
                    className={'cometchat-search__input-clear-button-icon'}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className={'cometchat-search__body'}>
          <div
            className={'cometchat-search__body-filters'}
            role="toolbar"
            aria-label="Search filters"
          >
            {visibleFilters.map(filterId => {
              const isActive = activeFilters.includes(filterId);
              return (
                <button
                  key={filterId}
                  type="button"
                  className={[
                    'cometchat-search__body-filter',
                    isActive ? 'cometchat-search__body-filter--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={isActive}
                  data-testid={`search-filter-${filterId}`}
                  onClick={() => handleToggleFilter(filterId)}
                >
                  <span
                    className={[
                      'cometchat-search__body-filter-icon',
                      `cometchat-search__body-filter-icon--${filterId}`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-hidden="true"
                  />
                  {FILTER_LABELS[filterId]}
                  {isActive && (
                    <span
                      className={'cometchat-search__body-filter-close-icon'}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results area */}
        {showInitialView ? (
          (liveCtx.initialView ?? (
            <div className={'cometchat-search__initial-view'}>
              <div className={'cometchat-search__initial-view-icon'} aria-hidden="true" />
              <span className={'cometchat-search__initial-view-title'}>Start Your Search</span>
              <span className={'cometchat-search__initial-view-subtitle'}>
                Search for conversations or messages by typing a keyword above.
              </span>
            </div>
          ))
        ) : (
          <div className={'cometchat-search__results'}>
            {showConversations && !liveCtx.hideConversationsSection && (
              <ConversationsSection ctx={liveCtx} />
            )}
            {showMessages && !liveCtx.hideMessagesSection && <MessagesSection ctx={liveCtx} />}
            {liveCtx.showUnifiedEmpty &&
              (liveCtx.emptyView ?? (
                <div className={'cometchat-search__empty-view'} aria-live="assertive">
                  <div className={'cometchat-search__empty-view-icon'} aria-hidden="true" />
                  <div className={'cometchat-search__empty-view-body'}>
                    <div className={'cometchat-search__empty-view-body-title'}>No Results</div>
                    <div className={'cometchat-search__empty-view-body-description'}>
                      We couldn&apos;t find any matches. Please try a different search keyword.
                    </div>
                  </div>
                </div>
              ))}
            {liveCtx.showUnifiedError &&
              (liveCtx.errorView ?? (
                <div className={'cometchat-search__error-view'} aria-live="assertive">
                  <div className={'cometchat-search__error-view-icon'} aria-hidden="true" />
                  <div className={'cometchat-search__error-view-body'}>
                    <div className={'cometchat-search__error-view-body-title'}>OOPS!</div>
                    <div className={'cometchat-search__error-view-body-description'}>
                      Looks like something went wrong
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </CometChatSearchContext.Provider>
  );
};

// ── Conversations section (mock, no SDK) ──

/**
 * Minimal conversations context for the storybook mock.
 * Provides just enough for CometChatConversationsItem to render correctly.
 */
function createConversationsCtx(loggedInUserId = 'me'): CometChatConversationsContextValue {
  return {
    conversations: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedConversationIds: [],
    selectedConversationsMap: new Map(),
    activeConversationId: null,
    searchText: '',
    typingIndicatorMap: new Map(),
    selectionMode: 'none',
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    hideGroupType: false,
    loggedInUserId,
    options: undefined,
    conversationToBeDeleted: null,
    hideDeleteConversation: false,
    showSearchBar: true,
    fetchNext: async () => {},
    setSearchText: () => {},
    selectConversation: () => {},
    deselectConversation: () => {},
    selectRange: () => {},
    deselectRange: () => {},
    clearSelection: () => {},
    setActiveConversation: () => {},
    handleItemClick: () => {},
    deleteConversation: async () => {},
    setConversationToBeDeleted: () => {},
  };
}

const ConversationsSection: React.FC<{ ctx: CometChatSearchContextValue }> = ({ ctx }) => {
  // Generate keyword-aware conversations matching Angular's MockSearchConversationsService
  const conversations = generateMockConversations(ctx.searchText, ctx.activeFilters);
  const fetchState = conversations.length === 0 ? 'empty' : ctx.conversationsState;
  const convCtx = createConversationsCtx();

  return (
    <div className={'cometchat-search__conversations'} role="region" aria-label="Conversations">
      <h3 className={'cometchat-search__conversations-header'}>Conversations</h3>

      {fetchState === 'loading' && <ShimmerList />}

      {fetchState === 'empty' && !ctx.bothScopesActive && <SectionEmpty />}

      {fetchState === 'error' && !ctx.bothScopesActive && <SectionError />}

      {(fetchState === 'loaded' || fetchState === 'idle') && (
        <CometChatConversationsContext.Provider value={convCtx}>
          <div className={'cometchat-search__conversations-list'} role="list">
            {conversations.map(conv => (
              <div
                key={conv.getConversationId()}
                className={'cometchat-search__conversations-list-item'}
                role="listitem"
                tabIndex={0}
                onClick={() =>
                  ctx.handleConversationClick({ conversation: conv, searchKeyword: ctx.searchText })
                }
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    ctx.handleConversationClick({
                      conversation: conv,
                      searchKeyword: ctx.searchText,
                    });
                  }
                }}
              >
                <CometChatConversationsItem conversation={conv} />
              </div>
            ))}
          </div>
        </CometChatConversationsContext.Provider>
      )}
    </div>
  );
};

// ── Messages section (mock, no SDK) ──

const MessagesSection: React.FC<{ ctx: CometChatSearchContextValue }> = ({ ctx }) => {
  // Generate keyword-aware messages matching Angular's MockSearchMessagesService
  const messages = generateMockMessages(ctx.searchText, ctx.activeFilters);
  const fetchState = ctx.messagesState;

  return (
    <div className={'cometchat-search__messages'} role="region" aria-label="Messages">
      <h3 className={'cometchat-search__messages-header'}>Messages</h3>

      {fetchState === 'loading' && <ShimmerList />}

      {fetchState === 'empty' && !ctx.bothScopesActive && <SectionEmpty />}

      {fetchState === 'error' && !ctx.bothScopesActive && <SectionError />}

      {(fetchState === 'loaded' || fetchState === 'idle') && (
        <div className={'cometchat-search__messages-list'} role="list">
          {messages.map((message, index) => {
            const showSep =
              index === 0 ||
              (() => {
                const cur = new Date(message.getSentAt() * 1000);
                const prev = new Date(messages[index - 1]!.getSentAt() * 1000);
                return (
                  cur.getMonth() !== prev.getMonth() || cur.getFullYear() !== prev.getFullYear()
                );
              })();
            return (
              <React.Fragment key={message.getId()}>
                {showSep && (
                  <div className={'cometchat-search__messages-date-separator'}>
                    {new Date(message.getSentAt() * 1000).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                )}
                <MessageRow message={message} ctx={ctx} />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MessageRow: React.FC<{
  message: CometChat.BaseMessage;
  ctx: CometChatSearchContextValue;
}> = ({ message, ctx }) => {
  const type = message.getType();
  const sender = message.getSender();
  const receiver = message.getReceiver();
  const title = (receiver as CometChat.User | CometChat.Group).getName();
  const sentAt = message.getSentAt();
  const date = new Date(sentAt * 1000);
  const day = date.getDate();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthIndex = date.getMonth();
  const month = monthIndex < months.length ? months[monthIndex] : undefined;
  let hours = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const timeStr = `${String(day)} ${month ?? ''}, ${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;

  let subtitle = '';
  if (type === 'text') {
    subtitle = `${sender.getName()}: ${(message as CometChat.TextMessage).getText()}`;
  } else if (type === 'image') {
    subtitle = `${sender.getName()}: screenshot.png`;
  } else if (type === 'audio') {
    subtitle = `${sender.getName()}: voice-note.mp3`;
  } else if (type === 'video') {
    subtitle = `${sender.getName()}: recording.mp4`;
  } else if (type === 'file') {
    const attachments = (message as any).getAttachments?.() ?? [];

    const fileName: string =
      attachments.length > 0 ? String((attachments[0] as any).getName()) : 'document.pdf';
    subtitle = `${sender.getName()}: ${fileName}`;
  }

  return (
    <div
      className={'cometchat-search__messages-list-item'}
      role="listitem"
      tabIndex={0}
      onClick={() => ctx.handleMessageClick({ message, searchKeyword: ctx.searchText })}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ctx.handleMessageClick({ message, searchKeyword: ctx.searchText });
        }
      }}
    >
      {/* Leading view — avatar for text/file, audio icon for audio, nothing for image/video */}
      {type === 'audio' ? (
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
      ) : type === 'image' || type === 'video' ? null : (
        <div className={'cometchat-search__messages-leading-view'}>
          <img
            src={`https://i.pravatar.cc/150?u=${(message.getReceiver() as CometChat.User | CometChat.Group).getName()}`}
            alt={(message.getReceiver() as CometChat.User | CometChat.Group).getName()}
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            style={{ borderRadius: '50%', objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </div>
      )}

      {/* Body */}
      <div className={'cometchat-search__messages-list-item-body'}>
        <div className={'cometchat-search__messages-list-item-title'}>{title}</div>
        <div className={'cometchat-search__messages-list-item-subtitle'}>{subtitle}</div>
      </div>

      {/* Trailing view */}
      {type === 'image' ? (
        <div className={'cometchat-search__messages-trailing-view'}>
          <img
            src="https://picsum.photos/seed/search/200/150"
            alt={`Image from ${sender.getName()}`}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : type === 'video' ? (
        <div className={'cometchat-search__messages-trailing-view'}>
          <img
            src="https://picsum.photos/seed/video-search/200/150"
            alt={`Video from ${sender.getName()}`}
            loading="lazy"
            decoding="async"
          />
          <div className={'cometchat-search__messages-trailing-view-play-icon'} />
        </div>
      ) : (
        <div className={'cometchat-search__messages-trailing-view--date'}>{timeStr}</div>
      )}
    </div>
  );
};

// ── Shared state sub-components ──

const ShimmerList: React.FC = () => (
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
);

const SectionEmpty: React.FC = () => (
  <div className={'cometchat-search__section-empty-view'} aria-live="assertive">
    <div className={'cometchat-search__section-empty-view-icon'} />
    <div className={'cometchat-search__section-state-body'}>
      <div className={'cometchat-search__section-state-title'}>No Results</div>
      <div className={'cometchat-search__section-state-description'}>
        We couldn&apos;t find any matches.
      </div>
    </div>
  </div>
);

const SectionError: React.FC = () => (
  <div className={'cometchat-search__section-error-view'} aria-live="assertive">
    <div className={'cometchat-search__section-error-view-icon'} />
    <div className={'cometchat-search__section-state-body'}>
      <div className={'cometchat-search__section-state-title'}>OOPS!</div>
      <div className={'cometchat-search__section-state-description'}>
        Looks like something went wrong
      </div>
    </div>
  </div>
);

// ============================================================
// Meta
// ============================================================

const meta: Meta = {
  title: 'Components/CometChatSearch',
  component: CometChatSearch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Global search component for finding conversations and messages across all chats.',
      },
    },
    layout: 'centered',
  },
  args: {
    hideBackButton: false,
    hideUserStatus: false,
    hideGroupType: false,
    hideReceipts: false,
  },
  argTypes: {
    hideBackButton: {
      control: 'boolean',
      description: 'Hide the back button in the search header',
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator in search results',
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide the group type badge in search results',
    },
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message read receipts in conversation results',
    },
    onBackClick: {
      action: 'onBackClick',
      description: 'Called when the back button is clicked',
    },
    onConversationClick: {
      action: 'onConversationClick',
      description: 'Called when a conversation result is clicked',
    },
    onMessageClick: {
      action: 'onMessageClick',
      description: 'Called when a message result is clicked',
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div
        style={{
          width: 360,
          height: 640,
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

// ============================================================
// Story components (hooks must live in named components)
// ============================================================

/** Interactive initial state — type in the input and toggle filters. */
const DefaultStory: React.FC<{
  hideBackButton?: boolean;
  hideUserStatus?: boolean;
  hideGroupType?: boolean;
  hideReceipts?: boolean;
}> = ({
  hideBackButton = false,
  hideUserStatus = false,
  hideGroupType = false,
  hideReceipts = false,
}) => {
  const [log, setLog] = useState<string[]>([]);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SearchShell
          ctx={{
            hideBackButton,
            hideUserStatus,
            hideGroupType,
            hideReceipts,
            handleBackClick: () => setLog(p => [...p, 'Back clicked']),
            handleConversationClick: ({ conversation }) =>
              setLog(p => [
                ...p,
                `Opened: ${(conversation.getConversationWith() as CometChat.User).getName()}`,
              ]),
            handleMessageClick: ({ message }) =>
              setLog(p => [...p, `Message #${String(message.getId())} clicked`]),
          }}
        />
      </div>
      {log.length > 0 && (
        <div
          style={{
            padding: '6px 12px',
            fontSize: 11,
            background: '#f5f5f5',
            borderTop: '1px solid #e0e0e0',
            maxHeight: 60,
            overflow: 'auto',
          }}
        >
          {log.slice(-3).map((l, i) => (
            <div key={i} style={{ color: '#555' }}>
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Unread filter pre-selected — shows conversations immediately without text input. */
const WithActiveFilterStory: React.FC = () => <SearchShell initialSearchFilter="unread" />;

/** Loading — shimmer in both sections. */
const LoadingStory: React.FC = () => (
  <SearchShell
    defaultSearchText="project"
    ctx={{ conversationsState: 'loading', messagesState: 'loading' }}
  />
);

/** Empty — unified "No Results" view. */
const EmptyStory: React.FC = () => (
  <SearchShell
    defaultSearchText="xyznotfound"
    ctx={{
      hideConversationsSection: true,
      hideMessagesSection: true,
      showUnifiedEmpty: true,
      conversationsState: 'empty',
      messagesState: 'empty',
    }}
  />
);

/** Error — unified error view. */
const ErrorStory: React.FC = () => (
  <SearchShell
    defaultSearchText="project"
    ctx={{
      hideConversationsSection: true,
      hideMessagesSection: true,
      showUnifiedError: true,
      conversationsState: 'error',
      messagesState: 'error',
    }}
  />
);

/** Conversations results — 3 conversation rows loaded. */
const ConversationsResultsStory: React.FC = () => (
  <SearchShell defaultSearchText="alice" searchIn={['conversations']} />
);

/** Messages results — 4 message rows with different types. */
const MessagesResultsStory: React.FC = () => (
  <SearchShell defaultSearchText="project" searchIn={['messages']} />
);

/** Both results — conversations + messages sections together. */
const BothResultsStory: React.FC = () => <SearchShell defaultSearchText="project" />;

/** Conversations only scope — messages section never shown. */
const ConversationsOnlyStory: React.FC = () => (
  <SearchShell defaultSearchText="alice" searchIn={['conversations']} />
);

/** Messages only scope — conversations section never shown. */
const MessagesOnlyStory: React.FC = () => (
  <SearchShell defaultSearchText="project" searchIn={['messages']} />
);

/** No back button. */
const NoBackButtonStory: React.FC = () => <SearchShell ctx={{ hideBackButton: true }} />;

/** Custom initialView slot. */
const CustomInitialViewStory: React.FC = () => (
  <SearchShell
    ctx={{
      initialView: (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Find anything</div>
          <div style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
            Search across all your conversations and messages
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {(['Photos', 'Videos', 'Files'] as const).map(label => (
              <span
                key={label}
                style={{
                  background: '#f0edff',
                  color: '#6852d6',
                  borderRadius: 12,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ),
    }}
  />
);

/** Custom emptyView slot. */
const CustomEmptyViewStory: React.FC = () => (
  <SearchShell
    defaultSearchText="xyznotfound"
    ctx={{
      hideConversationsSection: true,
      hideMessagesSection: true,
      showUnifiedEmpty: true,
      conversationsState: 'empty',
      messagesState: 'empty',
      emptyView: (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 64 }}>😕</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Nothing here</div>
          <div style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
            Try searching with different keywords or check your filters.
          </div>
        </div>
      ),
    }}
  />
);

// ============================================================
// Story exports
// ============================================================

/** Initial state — type in the input to see results appear. */
export const Default: Story = {
  render: args => (
    <DefaultStory
      hideBackButton={args.hideBackButton}
      hideUserStatus={args.hideUserStatus}
      hideGroupType={args.hideGroupType}
      hideReceipts={args.hideReceipts}
    />
  ),
};

/** Unread filter chip pre-selected. */
export const WithActiveFilter: Story = { render: () => <WithActiveFilterStory /> };

/** Shimmer loading placeholders in both sections. */
export const LoadingState: Story = { render: () => <LoadingStory /> };

/** Unified "No Results" view when both scopes return empty. */
export const EmptyState: Story = { render: () => <EmptyStory /> };

/** Unified error view when both scopes fail. */
export const ErrorState: Story = { render: () => <ErrorStory /> };

/** Loaded conversation results — 3 rows with avatar, name, last message, unread badge. */
export const ConversationsResults: Story = { render: () => <ConversationsResultsStory /> };

/** Loaded message results — text, image, and audio rows with date separators. */
export const MessagesResults: Story = { render: () => <MessagesResultsStory /> };

/** Both conversations and messages sections loaded simultaneously. */
export const BothResults: Story = { render: () => <BothResultsStory /> };

/** searchIn=["conversations"] — only conversation results, message filters hidden. */
export const ConversationsOnly: Story = { render: () => <ConversationsOnlyStory /> };

/** searchIn=["messages"] — only message results, conversation filters hidden. */
export const MessagesOnly: Story = { render: () => <MessagesOnlyStory /> };

/** hideBackButton=true — back arrow removed from header. */
export const NoBackButton: Story = { render: () => <NoBackButtonStory /> };
/** Custom initialView slot — replaces the default "Start Your Search" prompt. */
export const CustomInitialView: Story = { render: () => <CustomInitialViewStory /> };

/** Custom emptyView slot — replaces the default "No Results" view. */
export const CustomEmptyView: Story = { render: () => <CustomEmptyViewStory /> };
