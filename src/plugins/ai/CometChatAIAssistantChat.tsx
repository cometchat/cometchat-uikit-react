/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * CometChatAIAssistantChat
 *
 *
 *
 * 1. EMPTY STATE: When goToMessageId is null (no conversation selected),
 *    isAgentChat=true + no parentMessageId → message list shows emptyView.
 *    This is the greeting screen with suggestions.
 *
 * 2. MESSAGE LIST: Always rendered. Uses goToMessageId as parentMessageId.
 *    When goToMessageId is null → isAgentChat empty state (greeting).
 *    When goToMessageId is set → fetch and show that thread.
 *
 * 3. COMPOSER: Always rendered. activeParentMessageId is passed for threading.
 *    Set on first message sent (via onSendButtonClick callback).
 *    goToMessageId is set when loading from history.
 *
 * 4. CSS: Uses global CSS (not CSS module) to override hashed UIKit class names.
 *    Matches .cometchat-message-composer pattern.
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatAIAssistantChatProps } from './ai.types';
import {
  handleWebsocketMessage,
  stopStreamingMessage,
  setStreamSpeed,
  setAIAssistantTools,
  getStreamState,
  subscribeToStreamState,
} from './CometChatAIStreamingService';
import { CometChatAIAssistantChatHistory } from './CometChatAIAssistantChatHistory';
import { CometChatMessageList } from '../../components/CometChatMessageList/CometChatMessageList';
import { CometChatMessageComposer } from '../../components/CometChatMessageComposer/CometChatMessageComposer';
import { CometChatMessageHeader } from '../../components/CometChatMessageHeader/CometChatMessageHeader';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import { useCometChatMessageComposerContext } from '../../components/CometChatMessageComposer/CometChatMessageComposer.context';
import aiEmptyIcon from '../../assets/Profile.png';
// Global CSS — must be imported as a side-effect (not CSS module) so selectors
// like .cometchat-ai-assistant-chat .cometchat-message-composer work correctly.
import './CometChatAIAssistantChat.css';
import { useLocale } from '../../context/locale/LocaleContext';

// ---------------------------------------------------------------------------
// AISendButton — rendered INSIDE the composer context provider.
// Reads sendMessage + canSend from composer context, and streaming state
// ---------------------------------------------------------------------------

interface AISendButtonProps {
  chatId: string;
}

const AISendButton: React.FC<AISendButtonProps> = ({ chatId }) => {
  const { sendMessage, canSend, isInEditMode, editMessage } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  const subscribe = useCallback(
    (listener: () => void) => subscribeToStreamState(chatId, listener),
    [chatId]
  );
  const getSnapshot = useCallback(() => getStreamState(chatId), [chatId]);
  const streamState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isStreaming = !streamState.isComplete && streamState.hasStarted;

  const handleClick = useCallback(() => {
    if (isStreaming) {
      // to prevent clearing pending AI responses.
      return;
    }
    if (isInEditMode) {
      void editMessage();
    } else {
      void sendMessage();
    }
  }, [isStreaming, isInEditMode, editMessage, sendMessage]);

  const isActive = canSend && !isStreaming;

  return (
    <div
      className={[
        'cometchat-ai-assistant-chat__send-button-view',
        isActive ? 'cometchat-ai-assistant-chat__send-button-view--active' : '',
        isStreaming ? 'cometchat-ai-assistant-chat__send-button-view--streaming' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      role="button"
      tabIndex={isStreaming ? -1 : 0}
      aria-label={
        isStreaming
          ? getLocalizedString('accessibility_stop_generating')
          : getLocalizedString('accessibility_send_message')
      }
      aria-disabled={isStreaming}
      onKeyDown={e => {
        if (isStreaming) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className="cometchat-ai-assistant-chat__send-button-icon" aria-hidden="true" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// MessageComposerView — local sub-component
// ---------------------------------------------------------------------------

interface MessageComposerViewProps {
  user: CometChat.User;
  parentMessageId: number | null;
  startNewChat: boolean;
  onError?: ((e: CometChat.CometChatException) => void) | null;
  setParentMessageId: (id: number | null) => void;
  onSendButtonClick?: (message: CometChat.BaseMessage) => void;
}

const MessageComposerView = React.memo(
  ({
    user,
    parentMessageId,
    startNewChat,
    onError,
    onSendButtonClick,
  }: Omit<MessageComposerViewProps, 'setParentMessageId'> & {
    setParentMessageId?: (id: number | null) => void;
  }) => {
    const { getLocalizedString } = useLocale();
    const chatId = user.getUid();

    const subscribe = useCallback(
      (listener: () => void) => subscribeToStreamState(chatId, listener),
      [chatId]
    );
    const getSnapshot = useCallback(() => getStreamState(chatId), [chatId]);
    const streamState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const isStreaming = !streamState.isComplete && streamState.hasStarted;

    // Reset on new chat
    useEffect(() => {
      stopStreamingMessage(chatId);
    }, [startNewChat, chatId]);

    const composerClass = [
      'cometchat-ai-assistant-chat__message-composer-view',
      isStreaming ? 'cometchat-ai-assistant-chat__message-composer-view--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={composerClass}
        onKeyDown={e => {
          if (isStreaming) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <CometChatMessageComposer
          key={`message-composer-${String(startNewChat)}`}
          user={user}
          {...(parentMessageId != null ? { parentMessageId } : {})}
          layout="multiline"
          placeholder={getLocalizedString('ai_assistant_chat_composer_placeholder')}
          hideAttachmentButton
          hideEmojiKeyboardButton
          hideVoiceRecordingButton
          hideStickersButton
          hideAIButton
          hideLiveReaction
          disableMentions
          disableSoundForMessage
          disableTypingEvents
          sendButtonView={<AISendButton chatId={chatId} />}
          onSendButtonClick={
            onSendButtonClick
              ? (message: CometChat.BaseMessage) => {
                  onSendButtonClick(message);
                }
              : undefined
          }
          {...(onError !== undefined && onError !== null
            ? {
                onError: (e: unknown) => {
                  onError(e as CometChat.CometChatException);
                },
              }
            : {})}
        />
      </div>
    );
  }
);

MessageComposerView.displayName = 'MessageComposerView';

// ---------------------------------------------------------------------------
// CometChatAIAssistantChat — main component
// ---------------------------------------------------------------------------

const CometChatAIAssistantChatComponent: React.FC<CometChatAIAssistantChatProps> = ({
  user,
  streamingSpeed = 30,
  aiAssistantTools,
  loadLastAgentConversation = false,
  hideSuggestedMessages = false,
  suggestedMessages = [],
  emptyChatImageView,
  emptyChatGreetingView,
  emptyChatIntroMessageView,
  hideChatHistory = false,
  hideNewChat = false,
  showBackButton = false,
  showCloseButton: _showCloseButton = false,
  onBackButtonClicked,
  onCloseButtonClicked: _onCloseButtonClicked,
  onSendButtonClick,
  emptyView,
  loadingView,
  errorView,
  onError,
  className,
  parentMessageId: parentMessageIdProp,
  headerItemView,
  headerTitleView,
  headerSubtitleView,
  headerLeadingView,
  headerTrailingView,
  headerAuxiliaryButtonView,
}) => {
  const { getLocalizedString } = useLocale();
  const instanceId = useId();
  const chatId = user.getUid();
  const publish = usePublishEvent();

  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [startNewChat, setStartNewChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadLastAgentConversationState, setLoadLastAgentConversationState] =
    useState(loadLastAgentConversation);

  /**
   * goToMessageId — passed to the MESSAGE LIST as parentMessageId.
   * null = show empty state (isAgentChat + no parentMessageId → greeting).
   * set = fetch and show that thread.
   * Mirrors state.
   */
  const [goToMessageId, setGoToMessageId] = useState<number | null>(parentMessageIdProp ?? null);

  /**
   * activeParentMessageId — passed to the COMPOSER for threading.
   * Set on first message sent. Also set when loading from history.
   */
  const [activeParentMessageId, setActiveParentMessageId] = useState<number | null>(
    parentMessageIdProp ?? null
  );
  const activeParentMessageIdRef = useRef<number | null>(parentMessageIdProp ?? null);

  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);
  const sidebarTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Fetch logged-in user
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(u => {
        if (u) setLoggedInUser(u);
      })
      .catch(() => {
        /* non-fatal */
      });
  }, []);

  // Sync props
  useEffect(() => {
    setStreamSpeed(streamingSpeed);
  }, [streamingSpeed]);
  useEffect(() => {
    if (aiAssistantTools) setAIAssistantTools(aiAssistantTools);
  }, [aiAssistantTools]);
  useEffect(() => {
    setLoadLastAgentConversationState(loadLastAgentConversation);
  }, [loadLastAgentConversation]);

  useEffect(() => {
    if (parentMessageIdProp) {
      setGoToMessageId(parentMessageIdProp);
      setActiveParentMessageId(parentMessageIdProp);
      activeParentMessageIdRef.current = parentMessageIdProp;
    }
  }, [parentMessageIdProp]);

  // Attach AI assistant WebSocket listener
  useEffect(() => {
    const listenerId = `CometChatAIAssistantChat_${instanceId}`;
    CometChat.addAIAssistantListener(
      listenerId,
      new CometChat.AIAssistantListener({
        onAIAssistantEventReceived: (event: CometChat.AIAssistantBaseEvent) => {
          handleWebsocketMessage(event, chatId);
        },
      })
    );
    return () => {
      CometChat.removeAIAssistantListener(listenerId);
    };
  }, [instanceId, chatId]);

  // Sidebar focus management
  useEffect(() => {
    if (isSidebarOpen) {
      setTimeout(() => {
        const container = sidebarContainerRef.current;
        if (container) {
          const first = container.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          first?.focus();
        }
      }, 0);
    } else {
      sidebarTriggerRef.current?.focus();
    }
  }, [isSidebarOpen]);

  // ── Event handlers ──────────────────────────────────────────────────────

  const onNewChatButtonClick = useCallback(() => {
    setStartNewChat(prev => !prev);
    setGoToMessageId(null);
    setActiveParentMessageId(null);
    activeParentMessageIdRef.current = null;
    stopStreamingMessage(chatId);
    setLoadLastAgentConversationState(false);
  }, [chatId]);

  /**
   * History message click: set goToMessageId to load that thread.
   * Also set activeParentMessageId for composer threading.
   */
  const onHistoryMessageClick = useCallback(
    (message: CometChat.TextMessage) => {
      const msgId = message.getId();
      setGoToMessageId(msgId);
      setActiveParentMessageId(msgId);
      activeParentMessageIdRef.current = msgId;
      setIsSidebarOpen(false);
      stopStreamingMessage(chatId);
      setLoadLastAgentConversationState(false);
    },
    [chatId]
  );

  const onDeleteChat = useCallback(
    (id?: number) => {
      const activeParentId = Number(activeParentMessageIdRef.current);
      const msgId = Number(id);
      if (msgId) {
        if (activeParentId && msgId === activeParentId) onNewChatButtonClick();
      } else {
        onNewChatButtonClick();
        setIsSidebarOpen(false);
      }
    },
    [onNewChatButtonClick]
  );

  /**
   * Message sent: set activeParentMessageId for threading.
   * if status == success && !getParentMessageId() && getReceiverId() == user.getUid() && !parentMessageIdRef.current
   *   → setParentMessageId(data.message.getId())
   * NOTE: goToMessageId is NOT set here — list stays in empty/current state.
   * NOTE: startStreamingMessage is called in the message list events hook, not here.
   */
  const handleMessageSent = useCallback(
    (message: CometChat.BaseMessage) => {
      const msgId = message.getId();

      if (
        activeParentMessageIdRef.current === null &&
        !message.getParentMessageId() &&
        message.getReceiverId() === chatId
      ) {
        if (msgId) {
          setActiveParentMessageId(msgId);
          activeParentMessageIdRef.current = msgId;
        }
      }

      onSendButtonClick?.(message);
    },
    [chatId, onSendButtonClick]
  );

  // ── Derived values ──────────────────────────────────────────────────────

  const userMeta = user.getMetadata() as Record<string, unknown> | null | undefined;
  const greetingMessage = (userMeta?.greetingMessage as string | undefined) ?? user.getName();
  const introMessage =
    (userMeta?.introductoryMessage as string | undefined) ?? 'I am here to assist you!';
  const metaSuggestions = (userMeta?.suggestedMessages as string[] | undefined) ?? [];
  const displaySuggestions = suggestedMessages.length > 0 ? suggestedMessages : metaSuggestions;

  // ── Empty state (shown when goToMessageId is null) ──────────────────────

  const defaultEmptyView = (
    <div className="cometchat-ai-assistant-chat__empty-state">
      <div className="cometchat-ai-assistant-chat__empty-state-content">
        {emptyChatImageView ?? (
          <div className="cometchat-ai-assistant-chat__empty-state-icon">
            <img src={aiEmptyIcon} alt={getLocalizedString('alt_ai_assistant')} />
          </div>
        )}
        {emptyChatGreetingView ?? (
          <div className="cometchat-ai-assistant-chat__empty-state-greeting-message">
            {greetingMessage}
          </div>
        )}
        {emptyChatIntroMessageView ?? (
          <div className="cometchat-ai-assistant-chat__empty-state-intro-message">
            {introMessage}
          </div>
        )}
        {!hideSuggestedMessages && displaySuggestions.length > 0 && (
          <div className="cometchat-ai-assistant-chat__empty-state-suggested-messages">
            {displaySuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="cometchat-ai-assistant-chat__suggested-message-pill"
                onClick={() => {
                  publish({ type: 'ui:compose/text', text: suggestion });
                }}
              >
                {suggestion}
                <span
                  className="cometchat-ai-assistant-chat__suggested-message-icon"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Auxiliary view (New Chat + History buttons) ─────────────────────────

  const auxiliaryView = (
    <div className="cometchat-ai-assistant-chat__header-auxiliary-view">
      {!hideNewChat && (
        <div className="cometchat-ai-assistant-chat__header-auxiliary-view-new-chat">
          <div className="cometchat">
            <button
              type="button"
              className="cometchat-button"
              title={getLocalizedString('ai_assistant_chat_new_chat')}
              aria-label={getLocalizedString('ai_assistant_chat_new_chat')}
              onClick={onNewChatButtonClick}
            >
              <div className="cometchat-button__icon-default cometchat-button__icon cometchat-ai-assistant-chat__icon--new-chat" />
            </button>
          </div>
        </div>
      )}
      {!hideChatHistory && (
        <div className="cometchat-ai-assistant-chat__header-auxiliary-view-chat-history">
          <div className="cometchat">
            <button
              type="button"
              className="cometchat-button"
              title={getLocalizedString('ai_assistant_chat_history_title')}
              aria-label={getLocalizedString('ai_assistant_chat_history_title')}
              aria-expanded={isSidebarOpen}
              onClick={e => {
                sidebarTriggerRef.current = e.currentTarget as HTMLButtonElement;
                setIsSidebarOpen(prev => !prev);
              }}
            >
              <div className="cometchat-button__icon-default cometchat-button__icon cometchat-ai-assistant-chat__icon--chat-history" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  // <div class="cometchat">
  //   <div class="cometchat-ai-assistant-chat__wrapper">
  //     <div class="cometchat-ai-assistant-chat">
  //       <CometChatMessageHeader ... />
  //       <CometChatMessageList ... />
  //       <MessageComposerView ... />
  //     </div>
  //     <div class="cometchat-ai-assistant-chat__sidebar ...">
  //       <div class="cometchat-ai-assistant-chat__sidebar-content">
  //         <CometChatAIAssistantChatHistory ... />
  //       </div>
  //     </div>
  //     {isSidebarOpen && <div class="cometchat-ai-assistant-chat__sidebar-overlay" />}
  //   </div>
  // </div>

  const rootClasses = ['cometchat', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses} style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <div className="cometchat-ai-assistant-chat__wrapper">
        <div className="cometchat-ai-assistant-chat">
          {headerItemView ? (
            <>{headerItemView}</>
          ) : (
            <CometChatMessageHeader
              key={user.getUid()}
              user={user}
              hideBackButton={!showBackButton}
              hideVoiceCallButton
              hideVideoCallButton
              {...(headerLeadingView !== undefined ? { leadingView: headerLeadingView } : {})}
              {...(headerTitleView !== undefined ? { titleView: headerTitleView } : {})}
              {...(headerSubtitleView !== undefined ? { subtitleView: headerSubtitleView } : {})}
              {...(headerTrailingView !== undefined ? { trailingView: headerTrailingView } : {})}
              auxiliaryButtonView={headerAuxiliaryButtonView ?? auxiliaryView}
              {...(onBackButtonClicked !== undefined ? { onBack: onBackButtonClicked } : {})}
            />
          )}

          {/* Message list — always rendered.
              goToMessageId null → isAgentChat + no parentMessageId → empty state (greeting).
              goToMessageId set → fetch that thread. */}
          {loggedInUser !== null ? (
            <CometChatMessageList
              key={`message-list-${String(startNewChat)}-${String(goToMessageId ?? 'none')}-${String(loadLastAgentConversationState)}`}
              user={user}
              loggedInUser={loggedInUser}
              {...(goToMessageId !== null ? { parentMessageId: goToMessageId } : {})}
              isAgentChat
              emptyView={emptyView ?? defaultEmptyView}
              {...(loadingView !== undefined ? { loadingView } : {})}
              {...(errorView !== undefined ? { errorView } : {})}
              {...(onError !== undefined ? { onError } : {})}
              hideReplyOption
              hideCopyMessageOption
              hideDateSeparator
              hideDeleteMessageOption
              hideEditMessageOption
              hideGroupActionMessages
              hideMessageInfoOption
              hideMessagePrivatelyOption
              hideReactionOption
              hideReplyInThreadOption
              hideStickyDate
              hideTranslateMessageOption
              hideFlagMessageOption
              disableSoundForMessages
              loadLastAgentConversation={loadLastAgentConversationState}
              {...{
                textFormatters:
                  [] as import('../../formatters/CometChatTextFormatter').CometChatTextFormatter[],
              }}
            />
          ) : null}

          <MessageComposerView
            user={user}
            parentMessageId={activeParentMessageId}
            startNewChat={startNewChat}
            {...(onError ? { onError } : {})}
            setParentMessageId={setActiveParentMessageId}
            onSendButtonClick={handleMessageSent}
          />
        </div>

        <div
          className={[
            'cometchat-ai-assistant-chat__sidebar',
            isSidebarOpen ? 'cometchat-ai-assistant-chat__sidebar--open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div ref={sidebarContainerRef} className="cometchat-ai-assistant-chat__sidebar-content">
            <CometChatAIAssistantChatHistory
              user={user}
              hideNewChat={hideNewChat}
              loadLastAgentConversation={
                parentMessageIdProp === undefined ? loadLastAgentConversationState : false
              }
              onMessageClick={onHistoryMessageClick}
              onNewChatClick={(message?: CometChat.TextMessage | null) => {
                onDeleteChat(message?.getId());
              }}
              onClose={() => {
                setIsSidebarOpen(false);
              }}
              onEmpty={() => {
                setLoadLastAgentConversationState(false);
              }}
              {...(onError !== undefined ? { onError } : {})}
            />
          </div>
        </div>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="cometchat-ai-assistant-chat__sidebar-overlay"
            onClick={() => {
              setIsSidebarOpen(false);
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export const CometChatAIAssistantChat = React.memo(CometChatAIAssistantChatComponent);
CometChatAIAssistantChat.displayName = 'CometChatAIAssistantChat';

export default CometChatAIAssistantChat;
