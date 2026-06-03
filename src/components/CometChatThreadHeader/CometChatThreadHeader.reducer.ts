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
}

export type CometChatThreadHeaderAction =
  | { type: 'SET_REPLY_COUNT'; count: number }
  | { type: 'INCREMENT_REPLY_COUNT'; messageId: number }
  | { type: 'RESET'; initialCount: number };

export function createInitialState(initialCount: number): CometChatThreadHeaderState {
  return {
    replyCount: initialCount,
    processedMessageIds: new Set(),
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
      return {
        ...state,
        replyCount: state.replyCount + 1,
        processedMessageIds: newProcessed,
      };
    }

    case 'RESET':
      return {
        replyCount: action.initialCount,
        processedMessageIds: new Set(),
      };

    default:
      return state;
  }
}
