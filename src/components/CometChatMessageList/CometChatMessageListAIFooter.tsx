import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { CometChatSmartReplies } from '../base/CometChatSmartReplies/CometChatSmartReplies';
import { CometChatConversationStarter } from '../base/CometChatConversationStarter/CometChatConversationStarter';
import { CometChatConversationSummary } from '../base/CometChatConversationSummary/CometChatConversationSummary';
import './CometChatMessageList.css';

/** Which panel is currently displayed in the footer. */
type FooterPanel = 'none' | 'smartReplies' | 'conversationStarters' | 'conversationSummary';

export const CometChatMessageListAIFooter: React.FC = () => {
  const { allMessages, loggedInUser, user, group, options, state } =
    useCometChatMessageListContext();
  const publish = usePublishEvent();

  const {
    showSmartReplies,
    smartRepliesKeywords,
    smartRepliesDelayDuration,
    showConversationStarters,
  } = options;

  // --- Panel state (managed by events for summary, auto for starters/replies) ---
  const [activePanel, setActivePanel] = useState<FooterPanel>('none');
  const [autoPanel, setAutoPanel] = useState<FooterPanel>('none');

  // --- Smart Replies timer ---
  const smartRepliesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessagesLengthRef = useRef(0);

  // Stable identity values for dependency arrays
  const userId = user?.getUid();
  const groupId = group?.getGuid();

  // --- Listen to ui:panel/show and ui:panel/hide events ---
  useCometChatEvents(
    event => {
      if (event.type === 'ui:panel/show' && event.position === 'messageListFooter') {
        setActivePanel(event.panel);
      }
      if (event.type === 'ui:panel/hide' && event.position === 'messageListFooter') {
        setActivePanel('none');
      }
    },
    [userId, groupId]
  );

  // --- Conversation Starters: show when list is empty ---
  useEffect(() => {
    if (!showConversationStarters) {
      if (autoPanel === 'conversationStarters') setAutoPanel('none');
      return;
    }
    if (allMessages.length === 0 && state.fetchState === 'empty') {
      setAutoPanel('conversationStarters');
    } else {
      if (autoPanel === 'conversationStarters') setAutoPanel('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autoPanel read is intentional; we only want to react to external triggers
  }, [showConversationStarters, allMessages.length, state.fetchState]);

  // We track length changes to detect new messages, and store the timeout
  // so it survives re-renders without being cleared.
  const messagesLength = allMessages.length;
  const lastMessage = messagesLength > 0 ? allMessages[messagesLength - 1] : null;

  useEffect(() => {
    if (!showSmartReplies) {
      if (autoPanel === 'smartReplies') setAutoPanel('none');
      return;
    }

    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messagesLength;

    // No messages → nothing to check
    if (messagesLength === 0) {
      return;
    }

    // Skip if messages were REMOVED or unchanged (only react to additions)
    // Exception: on first meaningful load (prevLength was 0, now we have messages) — process it
    if (messagesLength < prevLength) {
      return;
    }
    if (messagesLength === prevLength && prevLength !== 0) {
      return;
    }

    if (!lastMessage) {
      return;
    }

    const sender = lastMessage.getSender() as CometChat.User | undefined;
    const senderUid = sender ? sender.getUid() : undefined;
    const loggedInUid = loggedInUser.getUid();

    if (!sender || senderUid === loggedInUid) {
      setAutoPanel(prev => (prev === 'smartReplies' ? 'none' : prev));
      if (smartRepliesTimeoutRef.current) {
        clearTimeout(smartRepliesTimeoutRef.current);
        smartRepliesTimeoutRef.current = null;
      }
      return;
    }

    // Clear existing timeout (debounce — only latest received message matters)
    if (smartRepliesTimeoutRef.current) {
      clearTimeout(smartRepliesTimeoutRef.current);
      smartRepliesTimeoutRef.current = null;
    }

    smartRepliesTimeoutRef.current = setTimeout(() => {
      if (!(lastMessage instanceof CometChat.TextMessage)) {
        return;
      }
      const textMessage = lastMessage.getText().toLowerCase();

      if (smartRepliesKeywords.length === 0) {
        setAutoPanel('smartReplies');
        return;
      }

      const escapedKeywords = smartRepliesKeywords.map((word: string) =>
        word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
      );
      const regex = new RegExp(
        `(?:\\b(${escapedKeywords.filter(word => word !== '\\?').join('|')})\\b|\\?)`,
        'i'
      );
      if (regex.test(textMessage)) {
        setAutoPanel('smartReplies');
      }
    }, smartRepliesDelayDuration);

    // NOTE: No cleanup here — we DON'T want the timeout cleared on re-render.
    // The timeout is cleared manually when a new message arrives or on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    messagesLength,
    showSmartReplies,
    smartRepliesKeywords,
    smartRepliesDelayDuration,
    loggedInUser,
  ]);

  useEffect(() => {
    return () => {
      if (smartRepliesTimeoutRef.current) {
        clearTimeout(smartRepliesTimeoutRef.current);
      }
    };
  }, []);

  // --- Reset panels when conversation changes ---
  useEffect(() => {
    setActivePanel('none');
    setAutoPanel('none');
  }, [userId, groupId]);

  // --- Suggestion click handler ---
  const handleSuggestionClick = useCallback(
    (text: string) => {
      publish({ type: 'ui:compose/text', text });
      setAutoPanel('none');
      setActivePanel('none');
    },
    [publish]
  );

  // --- Close handlers ---
  const handleSmartRepliesClose = useCallback(() => {
    setAutoPanel('none');
  }, []);

  const handleSummaryClose = useCallback(() => {
    setActivePanel('none');
    publish({ type: 'ui:panel/hide', position: 'messageListFooter' });
  }, [publish]);

  // --- Data fetching ---
  const getConversationStarters = useCallback(async (): Promise<string[]> => {
    const receiverId = user?.getUid() ?? group?.getGuid();
    const receiverType = user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    if (!receiverId) return [];
    const response = await CometChat.getConversationStarter(receiverId, receiverType);
    return response;
  }, [user, group]);

  const getSmartReplies = useCallback(async (): Promise<string[]> => {
    const receiverId = user?.getUid() ?? group?.getGuid();
    const receiverType = user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    if (!receiverId) return [];
    const response: unknown = await CometChat.getSmartReplies(receiverId, receiverType);
    if (typeof response === 'object' && response !== null) {
      return Object.values(response as Record<string, string>).filter(
        (v): v is string => typeof v === 'string' && v.trim().length > 0
      );
    }
    return [];
  }, [user, group]);

  const getConversationSummary = useCallback(async (): Promise<string> => {
    const receiverId = user?.getUid() ?? group?.getGuid();
    const receiverType = user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    if (!receiverId) return '';
    const response = await CometChat.getConversationSummary(receiverId, receiverType);
    if (typeof response === 'string') return response;
    return '';
  }, [user, group]);

  // --- Determine what to show ---
  // Active panel (event-driven, e.g., summary) takes priority over auto panel (starters/replies)
  const displayPanel = activePanel !== 'none' ? activePanel : autoPanel;

  // --- Render ---
  if (displayPanel === 'conversationSummary') {
    return (
      <div className={'cometchat-message-list__footer-panel'}>
        <CometChatConversationSummary
          getConversationSummary={getConversationSummary}
          onClose={handleSummaryClose}
        />
      </div>
    );
  }

  if (displayPanel === 'conversationStarters') {
    return (
      <div className={'cometchat-message-list__footer-conversation-starter'}>
        <CometChatConversationStarter
          getConversationStarters={getConversationStarters}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>
    );
  }

  if (displayPanel === 'smartReplies') {
    return (
      <div className={'cometchat-message-list__footer-smart-replies'}>
        <CometChatSmartReplies
          getSmartReplies={getSmartReplies}
          onSuggestionClick={handleSuggestionClick}
          onClose={handleSmartRepliesClose}
        />
      </div>
    );
  }

  return null;
};

CometChatMessageListAIFooter.displayName = 'CometChatMessageListAIFooter';
