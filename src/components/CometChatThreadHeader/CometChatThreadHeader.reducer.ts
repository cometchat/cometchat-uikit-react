/**
 * CometChatThreadHeader reducer — manages reply count with deduplication.
 *
 * Uses a processedMessageIds Set to prevent double-counting when both
 * SDK listener and UI event fire for the same message.
 */

export interface CometChatThreadHeaderState {
  /** Current reply count. */
  replyCount: number;
  /** Set of message IDs already counted to prevent duplicates. */
  processedMessageIds: Set<number>;
  /**
   * Offline support: own replies counted at pending, by `localMessageId`
   * (UIT-SEND-21). Their ack is not counted again; a discard takes them back;
   * a fresher parent from the SDK replaces the count and clears them.
   */
  localAdds: Set<string>;
}

export type CometChatThreadHeaderAction =
  | { type: 'SET_REPLY_COUNT'; count: number }
  | { type: 'INCREMENT_REPLY_COUNT'; messageId: number; localMessageId?: string }
  | { type: 'RESET'; initialCount: number }
  /** Offline: an own reply is pending (+1 once per `localMessageId`). */
  | { type: 'OFFLINE_REPLY_PENDING'; localMessageId: string }
  /** Offline: an own pending reply was discarded (−1 if it was counted). */
  | { type: 'OFFLINE_REPLY_DISCARDED'; localMessageId: string }
  /** Offline: a fresher parent from the SDK; its count replaces ours. */
  | { type: 'OFFLINE_PARENT_REFRESHED'; count: number };

export function createInitialState(initialCount: number): CometChatThreadHeaderState {
  return {
    replyCount: initialCount,
    processedMessageIds: new Set(),
    localAdds: new Set(),
  };
}

export function threadHeaderReducer(
  state: CometChatThreadHeaderState,
  action: CometChatThreadHeaderAction
): CometChatThreadHeaderState {
  switch (action.type) {
    case 'SET_REPLY_COUNT':
      return { ...state, replyCount: action.count };

    case 'INCREMENT_REPLY_COUNT': {
      // Prevent double-counting
      if (state.processedMessageIds.has(action.messageId)) {
        return state;
      }
      const newProcessed = new Set(state.processedMessageIds);
      newProcessed.add(action.messageId);
      // Offline: the ack of a reply already counted at pending is not a new reply.
      const countedAtPending =
        !!action.localMessageId && state.localAdds.has(action.localMessageId);
      return {
        ...state,
        replyCount: countedAtPending ? state.replyCount : state.replyCount + 1,
        processedMessageIds: newProcessed,
      };
    }

    case 'OFFLINE_REPLY_PENDING': {
      if (!action.localMessageId || state.localAdds.has(action.localMessageId)) return state;
      const localAdds = new Set(state.localAdds);
      localAdds.add(action.localMessageId);
      return { ...state, replyCount: state.replyCount + 1, localAdds };
    }

    case 'OFFLINE_REPLY_DISCARDED': {
      if (!state.localAdds.has(action.localMessageId)) return state;
      const localAdds = new Set(state.localAdds);
      localAdds.delete(action.localMessageId);
      return { ...state, replyCount: Math.max(0, state.replyCount - 1), localAdds };
    }

    case 'OFFLINE_PARENT_REFRESHED':
      return { ...state, replyCount: action.count, localAdds: new Set() };

    case 'RESET':
      return {
        replyCount: action.initialCount,
        processedMessageIds: new Set(),
        localAdds: new Set(),
      };

    default:
      return state;
  }
}
