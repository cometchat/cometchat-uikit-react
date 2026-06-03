import type { RefObject } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageListManager } from './CometChatMessageListManager';
import type {
  CometChatMessageListAction,
  CometChatMessageListState,
  CometChatUseMessageListOptions,
} from './CometChatMessageList.types';

// ---------------------------------------------------------------------------
// Shared refs type
// ---------------------------------------------------------------------------

/**
 * Shared mutable refs passed from the orchestrator hook to each sub-hook.
 *
 * These refs act as the coordination layer between sub-hooks — each sub-hook
 * reads/writes the same refs, exactly as they did when everything lived in
 * a single file. No new coupling is introduced.
 */
export interface MessageListRefs {
  /** Monotonically increasing counter to detect stale async results. */
  generationRef: RefObject<number>;
  /** The current SDK manager instance. Replaced on reconnection or scrollToBottom re-fetch. */
  managerRef: RefObject<CometChatMessageListManager | null>;
  /** Guards against concurrent fetchPrevious calls. */
  isFetchingPrevRef: RefObject<boolean>;
  /** Guards against concurrent fetchNext calls. */
  isFetchingNextRef: RefObject<boolean>;
  /** Guards against duplicate markMessageAsUnread calls for the same message. */
  lastUnreadMarkedIdRef: RefObject<string>;
  /** Tracks the current group reference for group event matching. */
  groupRef: RefObject<CometChat.Group | undefined>;
  /**
   * Tracks current reducer state so the useCometChatEvents handler can read it
   * without re-subscribing on every state change.
   */
  stateRef: RefObject<CometChatMessageListState>;
  /** Keeps callback refs stable so the event handler doesn't re-subscribe. */
  optionsRef: RefObject<CometChatUseMessageListOptions>;
  /**
   * Core initialization logic. Stored so the connection/connected handler
   * can re-run initialization on reconnection.
   */
  initializeRef: RefObject<(() => void) | null>;
  /**
   * Pending messages map for AI agent chat.
   * When streaming ends, these are spliced into the list replacing the run_started bubble.
   */
  pendingMessagesMap: Record<string, CometChat.BaseMessage[]>;
}

/** Dispatch function type for the message list reducer. */
export type MessageListDispatch = React.Dispatch<CometChatMessageListAction>;
