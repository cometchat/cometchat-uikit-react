import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchContext } from './CometChatSearch.context';
import { CometChatSearchConversationsList } from './CometChatSearchConversationsList';
import { CometChatSearchMessagesList } from './CometChatSearchMessagesList';
import { CometChatSearchBar } from '../base/CometChatSearchBar/CometChatSearchBar';
import { CometChatLocalize } from '../../resources/CometChatLocalize/CometChatLocalize';

/**
 * Helper to get a localized string using the shared CometChatLocalize instance.
 * Falls back to the key itself if no instance is available.
 */
function getLocalizedString(key: string): string {
  const instance = CometChatLocalize.getSharedInstance();
  if (instance) {
    const result = instance.t(key);
    return result && result !== key ? result : key;
  }
  return key;
}
import {
  getAvailableFilters,
  getVisibleFilters,
  toggleFilter as toggleFilterUtil,
  shouldRenderConversations,
  shouldRenderMessages,
} from './CometChatSearchFilterUtils';
import type {
  CometChatSearchRootProps,
  CometChatSearchContextValue,
  CometChatSearchFilter,
  CometChatSearchConversationClickEvent,
  CometChatSearchMessageClickEvent,
} from './CometChatSearch.types';
import type { CometChatFetchState } from '../../types';
import { useGlobalConfig } from '../../context/GlobalConfigContext';
import './CometChatSearch.css';

const DEFAULT_FILTERS: CometChatSearchFilter[] = [
  'audio',
  'files',
  'groups',
  'photos',
  'videos',
  'links',
  'unread',
];

const FILTER_LABEL_KEYS: Record<CometChatSearchFilter, string> = {
  audio: 'search_filter_audio',
  conversations: 'search_filter_conversations',
  files: 'search_filter_documents',
  groups: 'search_filter_groups',
  links: 'search_filter_links',
  messages: 'search_filter_messages',
  photos: 'search_filter_photos',
  unread: 'search_filter_unread',
  videos: 'search_filter_videos',
};

const DEBOUNCE_MS = 500;

/**
 * CometChatSearchRoot — Provider + default layout for CometChatSearch.
 *
 * Manages search state, filter logic, and unified empty/error coordination.
 * Renders the default layout when no children are provided.
 */
export const CometChatSearchRoot: React.FC<CometChatSearchRootProps> = ({
  searchIn = [],
  searchFilters = DEFAULT_FILTERS,
  initialSearchFilter,
  defaultSearchText = '',
  uid,
  guid,
  hideBackButton = false,
  hideUserStatus: hideUserStatusProp,
  hideGroupType = false,
  hideReceipts: hideReceiptsProp,
  textFormatters = [],
  conversationsRequestBuilder,
  messagesRequestBuilder,
  conversationOptions,
  lastMessageDateTimeFormat,
  messageSentAtDateTimeFormat,
  onBack,
  onConversationClicked,
  onMessageClicked,
  onError,
  initialView,
  loadingView,
  emptyView,
  errorView,
  conversationItemView,
  conversationLeadingView,
  conversationTitleView,
  conversationSubtitleView,
  conversationTrailingView,
  messageItemView,
  messageLeadingView,
  messageTitleView,
  messageSubtitleView,
  messageTrailingView,
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const globalConfig = useGlobalConfig();
  const hideUserStatus = hideUserStatusProp ?? globalConfig.hideUserStatus ?? false;
  const hideReceipts = hideReceiptsProp ?? globalConfig.hideReceipts ?? false;

  // ── Search state ──
  const [searchValue, setSearchValueState] = useState(defaultSearchText);
  const [searchText, setSearchText] = useState(defaultSearchText);
  const [activeFilters, setActiveFilters] = useState<CometChatSearchFilter[]>(
    initialSearchFilter ? [initialSearchFilter] : []
  );

  // ── Child state reporting ──
  const [conversationsState, setConversationsState] = useState<CometChatFetchState>('idle');
  const [messagesState, setMessagesState] = useState<CometChatFetchState>('idle');

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // ── Derived filter state ──
  const availableFilters = useMemo(
    () => getAvailableFilters(searchIn, searchFilters),
    [searchIn, searchFilters]
  );

  const visibleFilters = useMemo(
    () => getVisibleFilters(availableFilters, activeFilters, uid, guid, searchIn),
    [availableFilters, activeFilters, uid, guid, searchIn]
  );

  // ── Derived visibility ──
  const showInitialView = searchText.trim() === '' && activeFilters.length === 0;

  const showConversations = useMemo(
    () => shouldRenderConversations(searchText, activeFilters, searchIn, uid, guid),
    [searchText, activeFilters, searchIn, uid, guid]
  );

  const showMessages = useMemo(
    () => shouldRenderMessages(searchText, activeFilters, searchIn, uid, guid),
    [searchText, activeFilters, searchIn, uid, guid]
  );

  const bothScopesActive = showConversations && showMessages;

  const hideConversationsSection = useMemo(() => {
    if (!bothScopesActive) return false;
    if (conversationsState === 'empty' && messagesState === 'empty') return true;
    if (conversationsState === 'error' && messagesState === 'error') return true;
    if (conversationsState === 'empty' && messagesState === 'loaded') return true;
    return false;
  }, [bothScopesActive, conversationsState, messagesState]);

  const hideMessagesSection = useMemo(() => {
    if (!bothScopesActive) return false;
    if (conversationsState === 'empty' && messagesState === 'empty') return true;
    if (conversationsState === 'error' && messagesState === 'error') return true;
    if (messagesState === 'empty' && conversationsState === 'loaded') return true;
    return false;
  }, [bothScopesActive, conversationsState, messagesState]);

  const showUnifiedEmpty =
    bothScopesActive && conversationsState === 'empty' && messagesState === 'empty';

  const showUnifiedError =
    bothScopesActive && conversationsState === 'error' && messagesState === 'error';

  // ── Actions ──
  const setSearchValue = useCallback((value: string) => {
    setSearchValueState(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearchText(value.trim());
    }, DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchValueState('');
    setSearchText('');
    setActiveFilters([]);
    inputRef.current?.focus();
  }, []);

  const toggleFilter = useCallback((filterId: CometChatSearchFilter) => {
    setActiveFilters(prev => toggleFilterUtil(prev, filterId));
  }, []);

  const isFilterActive = useCallback(
    (filterId: CometChatSearchFilter) => activeFilters.includes(filterId),
    [activeFilters]
  );

  const getFilterLabel = useCallback((filterId: CometChatSearchFilter) => {
    const key = FILTER_LABEL_KEYS[filterId];
    return getLocalizedString(key);
  }, []);

  const handleBackClick = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const handleConversationClick = useCallback(
    (event: CometChatSearchConversationClickEvent) => {
      onConversationClicked?.(event);
    },
    [onConversationClicked]
  );

  const handleMessageClick = useCallback(
    (event: CometChatSearchMessageClickEvent) => {
      onMessageClicked?.(event);
    },
    [onMessageClicked]
  );

  const handleConversationsStateChange = useCallback((state: CometChatFetchState) => {
    setConversationsState(state);
  }, []);

  const handleMessagesStateChange = useCallback((state: CometChatFetchState) => {
    setMessagesState(state);
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error as CometChat.CometChatException);
    },
    [onError]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ── Context value ──
  const contextValue: CometChatSearchContextValue = useMemo(
    () => ({
      searchValue,
      searchText,
      activeFilters,
      visibleFilters,
      showInitialView,
      showConversations,
      showMessages,
      bothScopesActive,
      hideConversationsSection,
      hideMessagesSection,
      showUnifiedEmpty,
      showUnifiedError,
      conversationsState,
      messagesState,
      searchIn,
      searchFilters,
      uid,
      guid,
      hideBackButton,
      hideUserStatus,
      hideGroupType,
      hideReceipts,
      textFormatters,
      conversationsRequestBuilder,
      messagesRequestBuilder,
      conversationOptions,
      lastMessageDateTimeFormat,
      messageSentAtDateTimeFormat,
      initialView,
      loadingView,
      emptyView,
      errorView,
      conversationItemView,
      conversationLeadingView,
      conversationTitleView,
      conversationSubtitleView,
      conversationTrailingView,
      messageItemView,
      messageLeadingView,
      messageTitleView,
      messageSubtitleView,
      messageTrailingView,
      setSearchValue,
      clearSearch,
      toggleFilter,
      isFilterActive,
      getFilterLabel,
      handleBackClick,
      handleConversationClick,
      handleMessageClick,
      handleConversationsStateChange,
      handleMessagesStateChange,
      handleError,
    }),
    [
      searchValue,
      searchText,
      activeFilters,
      visibleFilters,
      showInitialView,
      showConversations,
      showMessages,
      bothScopesActive,
      hideConversationsSection,
      hideMessagesSection,
      showUnifiedEmpty,
      showUnifiedError,
      conversationsState,
      messagesState,
      searchIn,
      searchFilters,
      uid,
      guid,
      hideBackButton,
      hideUserStatus,
      hideGroupType,
      hideReceipts,
      textFormatters,
      conversationsRequestBuilder,
      messagesRequestBuilder,
      conversationOptions,
      lastMessageDateTimeFormat,
      messageSentAtDateTimeFormat,
      initialView,
      loadingView,
      emptyView,
      errorView,
      conversationItemView,
      conversationLeadingView,
      conversationTitleView,
      conversationSubtitleView,
      conversationTrailingView,
      messageItemView,
      messageLeadingView,
      messageTitleView,
      messageSubtitleView,
      messageTrailingView,
      setSearchValue,
      clearSearch,
      toggleFilter,
      isFilterActive,
      getFilterLabel,
      handleBackClick,
      handleConversationClick,
      handleMessageClick,
      handleConversationsStateChange,
      handleMessagesStateChange,
      handleError,
    ]
  );

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatSearchContext.Provider value={contextValue}>
      <div
        className={['cometchat', 'cometchat-search'].filter(Boolean).join(' ')}
        role="search"
        aria-label={getLocalizedString('search_title')}
      >
        {hasChildren ? children : <CometChatSearchDefaultLayout inputRef={inputRef} />}
      </div>
    </CometChatSearchContext.Provider>
  );
};

CometChatSearchRoot.displayName = 'CometChatSearch.Root';

// ── Default Layout ──

interface DefaultLayoutProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const CometChatSearchDefaultLayout: React.FC<DefaultLayoutProps> = ({ inputRef }) => {
  const ctx = React.useContext(CometChatSearchContext);
  if (!ctx) return null;

  return (
    <>
      {/* Header: back button + search input */}
      <div className={'cometchat-search__header'}>
        {!ctx.hideBackButton && (
          <button
            type="button"
            className={'cometchat-search__back-button'}
            data-testid="search-back-button"
            aria-label={getLocalizedString('accessibility_back') || 'Back'}
            onClick={ctx.handleBackClick}
          >
            <span className={'cometchat-search__back-button-icon'} aria-hidden="true" />
          </button>
        )}
        <div className={'cometchat-search__search-bar'}>
          <CometChatSearchBar.Root
            searchText={ctx.searchValue}
            onChange={ctx.setSearchValue}
            placeholderText={getLocalizedString('search_placeholder')}
            inputRef={inputRef}
            className={'cometchat-search__input'}
          >
            <CometChatSearchBar.Input data-testid="search-input" />
            {(ctx.searchValue || ctx.activeFilters.length > 0) && (
              <button
                type="button"
                className={'cometchat-search__input-clear-button'}
                data-testid="search-clear-button"
                aria-label={getLocalizedString('accessibility_clear_search') || 'Clear search'}
                onClick={ctx.clearSearch}
              >
                <span className={'cometchat-search__input-clear-button-icon'} aria-hidden="true" />
              </button>
            )}
          </CometChatSearchBar.Root>
        </div>
      </div>

      {/* Filter bar */}
      <div className={'cometchat-search__body'}>
        <div
          className={'cometchat-search__body-filters'}
          role="toolbar"
          aria-label={getLocalizedString('search_title')}
        >
          {ctx.visibleFilters.map(filterId => {
            const isActive = ctx.isFilterActive(filterId);
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
                onClick={() => {
                  ctx.toggleFilter(filterId);
                }}
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
                {ctx.getFilterLabel(filterId)}
                {isActive && (
                  <span className={'cometchat-search__body-filter-close-icon'} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results area */}
      {ctx.showInitialView ? (
        (ctx.initialView ?? (
          <div className={'cometchat-search__initial-view'}>
            <div className={'cometchat-search__initial-view-icon'} aria-hidden="true" />
            <span className={'cometchat-search__initial-view-title'}>
              {getLocalizedString('search_empty_title')}
            </span>
            <span className={'cometchat-search__initial-view-subtitle'}>
              {getLocalizedString('search_empty_subtitle')}
            </span>
          </div>
        ))
      ) : (
        <div className={'cometchat-search__results'}>
          {ctx.showConversations && <CometChatSearchConversationsList />}
          {ctx.showMessages && <CometChatSearchMessagesList />}

          {/* Unified empty view */}
          {ctx.showUnifiedEmpty &&
            (ctx.emptyView ?? (
              <div className={'cometchat-search__empty-view'} aria-live="assertive">
                <div className={'cometchat-search__empty-view-icon'} aria-hidden="true" />
                <div className={'cometchat-search__empty-view-body'}>
                  <div className={'cometchat-search__empty-view-body-title'}>
                    {getLocalizedString('search_no_result_title')}
                  </div>
                  <div className={'cometchat-search__empty-view-body-description'}>
                    {getLocalizedString('search_no_result_subtitle')}
                  </div>
                </div>
              </div>
            ))}

          {/* Unified error view */}
          {ctx.showUnifiedError &&
            (ctx.errorView ?? (
              <div className={'cometchat-search__error-view'} aria-live="assertive">
                <div className={'cometchat-search__error-view-icon'} aria-hidden="true" />
                <div className={'cometchat-search__error-view-body'}>
                  <div className={'cometchat-search__error-view-body-title'}>
                    {getLocalizedString('search_error_title')}
                  </div>
                  <div className={'cometchat-search__error-view-body-description'}>
                    {getLocalizedString('search_error_subtitle')}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};
