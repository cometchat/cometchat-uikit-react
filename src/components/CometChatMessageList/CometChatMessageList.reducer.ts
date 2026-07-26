import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  initialMessageListState,
  type CometChatMessageListState,
  type CometChatMessageListAction,
} from './CometChatMessageList.types';
import {
  cloneMessage,
  deduplicateById,
  updateReceiptsOnMessages,
  updateQuotedMessageReferences,
} from './CometChatMessageList.utils';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

export { initialMessageListState };

/**
 * Is this message in a "terminal failure" state that later updates must not overwrite?
 * Covers moderation disapproval and message-level errors.
 */
function isTerminalFailure(message: CometChat.BaseMessage): boolean {
  if (message instanceof CometChat.TextMessage || message instanceof CometChat.MediaMessage) {
    if (message.getModerationStatus() === CometChatUIKitConstants.moderationStatus.disapproved) {
      return true;
    }
  }
  const direct = (message as unknown as { error?: unknown }).error;
  if (direct) return true;
  const getMeta = (message as unknown as { getMetadata?: () => unknown }).getMetadata;
  if (typeof getMeta !== 'function') return false;
  const meta = getMeta.call(message) as { error?: unknown } | null | undefined;
  return Boolean(meta?.error);
}

/**
 * Decide whether `incoming` should replace `existing` in state.
 * Blocks replacement when existing is in terminal failure or has a resolved
 * moderation status that incoming would downgrade back to pending.
 */
function shouldReplace(existing: CometChat.BaseMessage, incoming: CometChat.BaseMessage): boolean {
  if (isTerminalFailure(existing)) {
    return isTerminalFailure(incoming);
  }
  if (
    (existing instanceof CometChat.TextMessage || existing instanceof CometChat.MediaMessage) &&
    (incoming instanceof CometChat.TextMessage || incoming instanceof CometChat.MediaMessage)
  ) {
    const existingStatus = existing.getModerationStatus();
    const incomingStatus = incoming.getModerationStatus();
    const moderation = CometChatUIKitConstants.moderationStatus;
    // Block only a true downgrade: a RESOLVED (approved/disapproved) message must not
    // revert to pending. The normal optimistic 'unmoderated' → confirmed 'pending'
    // send must still replace, else the bubble stays stuck on the id=0 copy.
    const existingResolved =
      existingStatus === moderation.approved || existingStatus === moderation.disapproved;
    if (existingResolved && incomingStatus === moderation.pending) {
      return false;
    }
  }
  return true;
}

/**
 * Is this message already present in the list? Matches on SDK id (confirmed
 * messages) or muid (optimistic ones). Falsy keys are ignored so an id of 0 or
 * an empty muid never matches everything. Used to guard append paths against
 * adding a message that is already in state.
 */
function messageAlreadyPresent(
  messages: CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): boolean {
  const id = message.getId();
  const muid = message.getMuid();
  return messages.some(m => {
    if (id && String(m.getId()) === String(id)) return true;
    if (muid && m.getMuid() === muid) return true;
    return false;
  });
}

/**
 * Pure reducer for the CometChatMessageList data layer.
 * Handles all state transitions via a discriminated union of actions.
 */
export function messageListReducer(
  state: CometChatMessageListState,
  action: CometChatMessageListAction
): CometChatMessageListState {
  switch (action.type) {
    // --- Fetch previous (older messages, prepended) ---

    case 'FETCH_PREVIOUS_START': {
      const fetchState = state.messages.length === 0 ? ('loading' as const) : state.fetchState;
      return {
        ...state,
        isFetchingMore: state.messages.length > 0,
        fetchState,
        error: null,
      };
    }

    case 'FETCH_PREVIOUS_SUCCESS': {
      const merged = [...action.messages, ...state.messages];
      const deduped = deduplicateById(merged);
      return {
        ...state,
        messages: deduped,
        fetchState: deduped.length === 0 && !state.hasMoreNewer ? 'empty' : 'loaded',
        hasMore: action.hasMore,
        isFetchingMore: false,
      };
    }

    case 'FETCH_PREVIOUS_ERROR': {
      const fetchState = state.messages.length === 0 ? ('error' as const) : state.fetchState;
      return {
        ...state,
        fetchState,
        isFetchingMore: false,
        error: action.error,
      };
    }

    // --- Fetch next (newer messages, appended) ---

    case 'FETCH_NEXT_START':
      return { ...state, isFetchingMore: true, error: null };

    case 'FETCH_NEXT_SUCCESS': {
      const merged = [...state.messages, ...action.messages];
      const deduped = deduplicateById(merged);
      return {
        ...state,
        messages: deduped,
        fetchState: 'loaded',
        hasMoreNewer: action.hasMoreNewer,
        isFetchingMore: false,
      };
    }

    case 'FETCH_NEXT_ERROR':
      return { ...state, isFetchingMore: false, error: action.error };

    // --- Fetch around a messageId (bidirectional — for goToMessage flow) ---

    case 'FETCH_AROUND_SUCCESS': {
      const deduped = deduplicateById(action.messages);
      return {
        ...state,
        messages: deduped,
        fetchState: deduped.length === 0 ? 'empty' : 'loaded',
        hasMore: action.hasMore,
        hasMoreNewer: action.hasMoreNewer,
        hasReachedLatest: !action.hasMoreNewer,
        isFetchingMore: false,
        scrollToMessageId: action.targetMessageId,
        scrollToMessageHighlight: action.highlight ?? false,
      };
    }

    // --- Send lifecycle ---

    case 'MESSAGE_SEND_START': {
      const existsByMuid = state.messages.some(m => m.getMuid() === action.muid);
      // Not the pending copy we're updating, yet already in state (e.g. the
      // confirmed message landed first) — skip rather than append a duplicate.
      if (!existsByMuid && messageAlreadyPresent(state.messages, action.message)) {
        return state;
      }
      const messages = existsByMuid
        ? state.messages.map(m => (m.getMuid() === action.muid ? action.message : m))
        : [...state.messages, action.message];
      const fetchState =
        state.fetchState === 'empty' && messages.length > 0 ? 'loaded' : state.fetchState;
      return { ...state, messages, fetchState };
    }

    case 'MESSAGE_SEND_SUCCESS': {
      const messages = state.messages.map(m => {
        if (m.getMuid() !== action.muid) return m;
        if (!shouldReplace(m, action.confirmedMessage)) return m;
        // Preserve quotedMessage from the pending message onto the confirmed one
        const getQuoted = (m as unknown as { getQuotedMessage?: () => unknown }).getQuotedMessage;
        const setQuoted = (
          action.confirmedMessage as unknown as { setQuotedMessage?: (msg: unknown) => void }
        ).setQuotedMessage;
        if (typeof getQuoted === 'function' && typeof setQuoted === 'function') {
          const quoted = getQuoted.call(m);
          if (quoted) setQuoted.call(action.confirmedMessage, quoted);
        }
        return action.confirmedMessage;
      });
      return { ...state, messages };
    }

    case 'MESSAGE_SEND_ERROR': {
      const found = state.messages.some(m => m.getMuid() === action.muid);
      if (found) {
        // Replace the pending message with the errored version
        const messages = state.messages.map(m =>
          m.getMuid() === action.muid ? action.message : m
        );
        return { ...state, messages };
      }
      // Pending message not yet in state (React batching race) — add it directly,
      // unless it's already present under another key.
      if (messageAlreadyPresent(state.messages, action.message)) return state;
      return { ...state, messages: [...state.messages, action.message] };
    }

    // --- Real-time updates ---

    case 'REMOVE_STREAMING_BUBBLE': {
      const runStartedType = CometChat.AI_ASSISTANT_EVENTS.RUN_STARTED;
      // Only remove the LAST run_started bubble (the active one).
      // Earlier run_started bubbles have already completed streaming and hold the
      // previous AI response content via their snapshotted state. Here, the bubble IS the
      // final response when no SDK messages arrive.
      const lastRunStartedIdx = state.messages.reduce(
        (lastIdx, m, i) => (m.getType() === runStartedType ? i : lastIdx),
        -1
      );
      if (lastRunStartedIdx === -1) return state;
      const filtered = state.messages.filter((_, i) => i !== lastRunStartedIdx);
      return { ...state, messages: filtered };
    }

    case 'ADD_STREAMING_BUBBLE': {
      if (messageAlreadyPresent(state.messages, action.message)) return state;
      const messages = [...state.messages, action.message];
      const fetchState = state.fetchState === 'empty' ? 'loaded' : state.fetchState;
      return { ...state, messages, fetchState };
    }

    case 'PROCESS_PENDING_MESSAGES': {
      const { pendingMessagesMap } = action;
      if (Object.keys(pendingMessagesMap).length === 0) return state;

      const runStartedType = CometChat.AI_ASSISTANT_EVENTS.RUN_STARTED;
      let messagesCopy = [...state.messages];
      let changed = false;

      for (const runId of Object.keys(pendingMessagesMap)) {
        const pendingMessages = pendingMessagesMap[runId];
        if (!pendingMessages || pendingMessages.length === 0) continue;

        const runStartedIndex = messagesCopy.findIndex(m => {
          if (m.getType() !== runStartedType) return false;
          const data = (m as unknown as { getData?: () => { runId?: unknown } }).getData?.();
          return data && String(data.runId) === runId;
        });

        if (runStartedIndex !== -1) {
          messagesCopy.splice(runStartedIndex, 1, ...pendingMessages);
          changed = true;
        } else {
          messagesCopy = [...messagesCopy, ...pendingMessages];
          changed = true;
        }
      }

      if (!changed) return state;
      return { ...state, messages: messagesCopy };
    }

    case 'MESSAGE_RECEIVED': {
      const incomingId = action.message.getId();

      // For local group action messages (no SDK ID), skip duplicate check — just append.
      if (!action.isLocalGroupAction) {
        const existingIndex = state.messages.findIndex(
          m => String(m.getId()) === String(incomingId)
        );
        if (existingIndex !== -1) {
          const messages = [...state.messages];
          messages[existingIndex] = action.message;
          return { ...state, messages };
        }
        // Also skip if it's already present under another key (e.g. muid) — don't
        // append a duplicate.
        if (messageAlreadyPresent(state.messages, action.message)) {
          return state;
        }
      }

      // When not at latest, only increment count — don't append out-of-order messages.
      if (!state.hasReachedLatest) {
        return {
          ...state,
          newMessageCount: action.fromLoggedInUser
            ? state.newMessageCount
            : state.newMessageCount + 1,
        };
      }

      const messages = [...state.messages, action.message];
      const shouldResetCount =
        !state.markedUnreadByUser && (state.isAtBottom || action.fromLoggedInUser);
      const isNewFromOther = !action.fromLoggedInUser;
      return {
        ...state,
        messages,
        fetchState: 'loaded',
        newMessageCount: shouldResetCount
          ? 0
          : isNewFromOther
            ? state.newMessageCount + 1
            : state.newMessageCount,
        unreadCount:
          state.markedUnreadByUser && isNewFromOther ? state.unreadCount + 1 : state.unreadCount,
      };
    }

    case 'MESSAGE_EDITED': {
      let messages = state.messages.map(m => {
        if (String(m.getId()) !== String(action.message.getId())) return m;
        return shouldReplace(m, action.message) ? action.message : m;
      });
      messages = updateQuotedMessageReferences(messages, action.message);
      return { ...state, messages };
    }

    case 'MESSAGE_DELETED': {
      const messages = state.messages.map(m =>
        String(m.getId()) === String(action.message.getId()) ? action.message : m
      );
      return { ...state, messages };
    }

    // --- Moderation ---

    case 'MESSAGE_MODERATED': {
      const msgId = action.message.getId();
      const msgMuid = action.message.getMuid() || '';
      const messages = state.messages.map(m => {
        if (m.getId() === msgId || (msgMuid && m.getMuid() === msgMuid)) {
          return action.message;
        }
        return m;
      });
      return { ...state, messages };
    }

    // --- Receipts ---

    case 'RECEIPT_UPDATE': {
      const messages = updateReceiptsOnMessages(
        state.messages,
        action.receiptType,
        action.messageId,
        action.timestamp,
        action.loggedInUserId
      );
      if (messages === state.messages) return state;
      return { ...state, messages };
    }

    // --- Reactions ---

    case 'REACTION_UPDATE': {
      const messages = state.messages.map(m => {
        if (String(m.getId()) === String(action.messageId)) {
          const next = cloneMessage(m);
          next.setReactions(action.reactions);
          return next;
        }
        return m;
      });
      return { ...state, messages };
    }

    // --- Reply count ---

    case 'UPDATE_REPLY_COUNT': {
      const idx = state.messages.findIndex(m => m.getId() === action.parentMessageId);
      if (idx === -1) return state;
      const target = state.messages[idx];
      if (!target) return state;
      const next = cloneMessage(target);
      const currentCount = next.getReplyCount() || 0;
      next.setReplyCount(currentCount + 1);
      const messages = [...state.messages];
      messages[idx] = next;
      return { ...state, messages };
    }

    // --- State flags ---

    case 'SET_HAS_REACHED_LATEST':
      return { ...state, hasReachedLatest: action.hasReachedLatest };

    case 'UPDATE_GROUP_REFERENCE':
      return state;

    case 'SET_AT_BOTTOM':
      return {
        ...state,
        isAtBottom: action.isAtBottom,
        newMessageCount: action.isAtBottom && !state.markedUnreadByUser ? 0 : state.newMessageCount,
      };

    case 'SET_SCROLL_TO_MESSAGE':
      return {
        ...state,
        scrollToMessageId: action.messageId,
        scrollToMessageHighlight: action.highlight ?? false,
      };

    case 'CLEAR_NEW_MESSAGE_COUNT':
      return { ...state, newMessageCount: state.markedUnreadByUser ? state.newMessageCount : 0 };

    // --- Unread tracking ---

    case 'SET_LAST_READ_MESSAGE_ID':
      return { ...state, lastReadMessageId: action.messageId };

    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.count };

    case 'SET_CONVERSATION_READ':
      return {
        ...state,
        isConversationRead: true,
        unreadCount: 0,
        newMessageCount: 0,
      };

    case 'SET_MARKED_UNREAD_BY_USER':
      return { ...state, markedUnreadByUser: action.value };

    case 'SET_SHOW_UNREAD_BANNER':
      return { ...state, showUnreadBanner: action.value };

    // --- Reset ---

    case 'RESET':
      return initialMessageListState;

    default:
      return state;
  }
}
