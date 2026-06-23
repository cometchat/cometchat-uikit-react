/**
 * CometChatAIAssistantChatHistory
 *
 * Sidebar component showing past AI conversations.
 * Latest messages appear at top; scrolling to the bottom fetches older messages.
 * Each item shows the message text with a delete button on hover.
 *
 * Features:
 * - Infinite scroll (fetches older messages when scrolling to bottom)
 * - Date separators between messages from different days
 * - Delete button on hover for each message
 * - New Chat button to start a fresh conversation
 * - Loading shimmer, empty, and error states
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 * - Auto-loads most recent conversation when loadLastAgentConversation=true
 *
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatAIAssistantChatHistoryProps,
  CometChatAIAssistantChatHistoryHandle,
} from './ai.types';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import './CometChatAIAssistantChatHistory.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { formatDateWithConfig } from '../../resources/CometChatLocalize/dateFormat.utils';

type HistoryState = 'loading' | 'loaded' | 'empty' | 'error';

const SHIMMER_COUNT = 8;

function isDifferentDay(a: number | undefined, b: number | undefined): boolean {
  if (!a || !b) return false;
  const dateA = new Date(a * 1000);
  const dateB = new Date(b * 1000);
  return (
    dateA.getDate() !== dateB.getDate() ||
    dateA.getMonth() !== dateB.getMonth() ||
    dateA.getFullYear() !== dateB.getFullYear()
  );
}

export const CometChatAIAssistantChatHistory = forwardRef<
  CometChatAIAssistantChatHistoryHandle,
  CometChatAIAssistantChatHistoryProps
>(
  (
    {
      user,
      group,
      hideNewChat = false,
      loadLastAgentConversation = false,
      onMessageClick,
      onNewChatClick,
      onClose,
      onEmpty,
      onError,
      emptyStateView,
      errorStateView,
      className,
    },
    ref
  ) => {
    const { getLocalizedString, calendarObject, timezone, dateLocaleLanguage } = useLocale();
    const [messages, setMessages] = useState<CometChat.TextMessage[]>([]);
    const [state, setState] = useState<HistoryState>('loading');
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    const requestRef = useRef<CometChat.MessagesRequest | null>(null);
    const isFetchingRef = useRef(false);
    const messageCountRef = useRef(0);
    const listRef = useRef<HTMLUListElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
    const hasFetchedRef = useRef(false);

    // Stable refs for callback props to avoid re-triggering effects
    const onMessageClickRef = useRef(onMessageClick);
    onMessageClickRef.current = onMessageClick;
    const onEmptyRef = useRef(onEmpty);
    onEmptyRef.current = onEmpty;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    // Expose addMessage to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        addMessage: (message: CometChat.TextMessage) => {
          setMessages(prev => {
            const updated = [message, ...prev];
            messageCountRef.current = updated.length;
            return updated;
          });
          setState('loaded');
        },
      }),
      []
    );

    const buildRequest = useCallback(() => {
      const builder = new CometChat.MessagesRequestBuilder()
        .hideReplies(true)
        .setLimit(30)
        .setType(CometChatUIKitConstants.MessageTypes.text)
        .setCategory(CometChatUIKitConstants.MessageCategory.message)
        .hideDeletedMessages(true);

      if (user) builder.setUID(user.getUid());
      else if (group) builder.setGUID(group.getGuid());

      return builder.build();
    }, [user, group]);

    const fetchMessages = useCallback(async (shouldLoadLast = false) => {
      if (isFetchingRef.current || !requestRef.current) return;
      isFetchingRef.current = true;

      try {
        const fetched = await requestRef.current.fetchPrevious();
        const textMessages: CometChat.TextMessage[] = [];
        for (const m of fetched) {
          if (m instanceof CometChat.TextMessage) {
            textMessages.push(m);
          }
        }

        if (textMessages.length > 0) {
          const reversed = [...textMessages].reverse();
          setMessages(prev => {
            const updated: CometChat.TextMessage[] = [...prev, ...reversed];
            messageCountRef.current = updated.length;
            return updated;
          });
          setState('loaded');

          if (shouldLoadLast && reversed.length > 0) {
            const first = reversed[0];
            if (first) onMessageClickRef.current?.(first);
          }
        } else {
          if (messageCountRef.current === 0) {
            setState('empty');
            onEmptyRef.current?.();
          } else {
            setState('loaded');
          }
        }
      } catch (err) {
        if (messageCountRef.current === 0) {
          setState('error');
        }
        onErrorRef.current?.(err as CometChat.CometChatException);
      } finally {
        isFetchingRef.current = false;
      }
    }, []);

    useEffect(() => {
      hasFetchedRef.current = false;
    }, [user, group]);

    useEffect(() => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      requestRef.current = buildRequest();
      messageCountRef.current = 0;
      setMessages([]);
      setState('loading');
      void fetchMessages(loadLastAgentConversation);
    }, [user, group, buildRequest, fetchMessages, loadLastAgentConversation]);

    // Infinite scroll — fetch more when scrolled to bottom
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLUListElement>) => {
        const el = e.currentTarget;
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        if (isAtBottom && state === 'loaded' && !isFetchingRef.current) {
          void fetchMessages();
        }
      },
      [state, fetchMessages]
    );

    const handleDeleteMessage = useCallback(
      (message: CometChat.TextMessage, e: React.MouseEvent) => {
        e.stopPropagation();
        CometChat.deleteMessage(String(message.getId()))
          .then(() => {
            setMessages(prev => prev.filter(m => m.getId() !== message.getId()));
            messageCountRef.current -= 1;
            if (messageCountRef.current === 0) {
              setState('empty');
              onEmpty?.();
            }
            onNewChatClick?.(message);
          })
          .catch((err: unknown) => onError?.(err as CometChat.CometChatException));
      },
      [onEmpty, onNewChatClick, onError]
    );

    // Keyboard navigation (roving tabindex)
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, index: number) => {
        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            const next = Math.min(index + 1, messages.length - 1);
            setFocusedIndex(next);
            itemRefs.current[next]?.focus();
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            const prev = Math.max(index - 1, 0);
            setFocusedIndex(prev);
            itemRefs.current[prev]?.focus();
            break;
          }
          case 'Enter':
          case ' ': {
            e.preventDefault();
            const msg = messages[index];
            if (msg) onMessageClick?.(msg);
            break;
          }
          case 'Escape': {
            e.preventDefault();
            onClose?.();
            break;
          }
        }
      },
      [messages, onMessageClick, onClose]
    );

    const rootClasses = ['cometchat-ai-assistant-chat-history', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={rootClasses}>
        {/* Header */}
        <div className={'cometchat-ai-assistant-chat-history__header'}>
          <span className={'cometchat-ai-assistant-chat-history__title'}>
            {getLocalizedString('ai_assistant_chat_history_title')}
          </span>
          <button
            type="button"
            className={'cometchat-ai-assistant-chat-history__close-btn'}
            aria-label={getLocalizedString('ai_assistant_chat_history_close')}
            onClick={onClose}
          >
            <span
              className={'cometchat-ai-assistant-chat-history__close-icon'}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* New Chat row */}
        {!hideNewChat && (
          <button
            type="button"
            className={'cometchat-ai-assistant-chat-history__new-chat-row'}
            aria-label={getLocalizedString('ai_assistant_chat_new_chat')}
            onClick={() => onNewChatClick?.()}
          >
            <span
              className={'cometchat-ai-assistant-chat-history__new-chat-icon'}
              aria-hidden="true"
            />
            <span className={'cometchat-ai-assistant-chat-history__new-chat-label'}>
              {getLocalizedString('ai_assistant_chat_new_chat')}
            </span>
          </button>
        )}

        {/* Loading shimmer */}
        {state === 'loading' && messages.length === 0 && (
          <ul
            className={'cometchat-ai-assistant-chat-history__shimmer-list'}
            aria-busy="true"
            aria-label={getLocalizedString('ai_assistant_chat_history_loading')}
          >
            {Array.from({ length: SHIMMER_COUNT }).map((_, i) => (
              <li
                key={i}
                className={'cometchat-ai-assistant-chat-history__shimmer-item'}
                aria-hidden="true"
              >
                <div
                  className={[
                    'cometchat-ai-assistant-chat-history__shimmer-line',
                    'cometchat-ai-assistant-chat-history__shimmer-line--title',
                  ].join(' ')}
                />
                <div
                  className={[
                    'cometchat-ai-assistant-chat-history__shimmer-line',
                    'cometchat-ai-assistant-chat-history__shimmer-line--subtitle',
                  ].join(' ')}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className={'cometchat-ai-assistant-chat-history__error-state'} role="alert">
            {errorStateView ?? (
              <>
                <p className={'cometchat-ai-assistant-chat-history__error-title'}>
                  Something went wrong
                </p>
                <p className={'cometchat-ai-assistant-chat-history__error-subtitle'}>
                  Unable to load chat history. Please try again.
                </p>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {state === 'empty' && (
          <div className={'cometchat-ai-assistant-chat-history__empty-state'}>
            {emptyStateView ?? (
              <>
                <p className={'cometchat-ai-assistant-chat-history__empty-title'}>
                  No conversations yet
                </p>
                <p className={'cometchat-ai-assistant-chat-history__empty-subtitle'}>
                  Start a new chat to begin
                </p>
              </>
            )}
          </div>
        )}

        {/* Message list */}
        {(state === 'loaded' || (state === 'loading' && messages.length > 0)) && (
          <ul
            ref={listRef}
            className={'cometchat-ai-assistant-chat-history__list'}
            role="listbox"
            aria-label={getLocalizedString('ai_assistant_chat_history_title')}
            onScroll={handleScroll}
          >
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showSeparator = isDifferentDay(prevMessage?.getSentAt(), message.getSentAt());

              return (
                <React.Fragment key={message.getId()}>
                  {showSeparator && (
                    <li
                      className={'cometchat-ai-assistant-chat-history__date-separator'}
                      role="presentation"
                      aria-hidden="true"
                    >
                      <span className={'cometchat-ai-assistant-chat-history__date-separator-text'}>
                        {formatDateWithConfig(
                          message.getSentAt(),
                          {
                            today: getLocalizedString('date_today'),
                            yesterday: getLocalizedString('date_yesterday'),
                            lastWeek: undefined,
                            otherDays: 'DD MMM, YYYY',
                            ...calendarObject,
                          },
                          { timezone, locale: dateLocaleLanguage }
                        )}
                      </span>
                    </li>
                  )}
                  <li
                    ref={el => {
                      itemRefs.current[index] = el;
                    }}
                    className={'cometchat-ai-assistant-chat-history__item'}
                    role="option"
                    tabIndex={
                      focusedIndex === index || (focusedIndex === -1 && index === 0) ? 0 : -1
                    }
                    aria-selected={false}
                    onClick={() => onMessageClick?.(message)}
                    onKeyDown={e => {
                      handleKeyDown(e, index);
                    }}
                  >
                    <span className={'cometchat-ai-assistant-chat-history__item-text'}>
                      {message.getText()}
                    </span>
                    <button
                      type="button"
                      className={'cometchat-ai-assistant-chat-history__delete-btn'}
                      aria-label={getLocalizedString('conversation_delete_icon_hover')}
                      onClick={e => {
                        handleDeleteMessage(message, e);
                      }}
                    >
                      <span
                        className={'cometchat-ai-assistant-chat-history__delete-icon'}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
);

CometChatAIAssistantChatHistory.displayName = 'CometChatAIAssistantChatHistory';

export default CometChatAIAssistantChatHistory;
