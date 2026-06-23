/**
 * AI Plugin Types
 *
 * All TypeScript interfaces for the AI plugin system.
 * Covers: AIPlugin, AIAssistantBubble, StreamMessageBubble,
 *         AIAssistantChat (full orchestrator), ChatHistory sidebar,
 *         ToolCallArgumentBubble, ToolCallResultBubble.
 */

import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// Stream event types (mirrors CometChatUIKitConstants.streamMessageTypes)
// ---------------------------------------------------------------------------

/** Discriminated union of AI assistant stream events from the SDK. */
export type CometChatAIStreamEventType =
  | 'run_started'
  | 'text_message_start'
  | 'text_message_content'
  | 'text_message_end'
  | 'run_finished'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'tool_call_args'
  | 'tool_call_result';

/** A single AI stream event chunk received from the SDK. */
export interface CometChatAIStreamEvent {
  /** The event type. */
  type: CometChatAIStreamEventType;
  /** The text content chunk (present for text_message_content). */
  content?: string;
  /** The tool call ID (present for tool_call_* events). */
  toolCallId?: string;
  /** The tool name (present for tool_call_start). */
  toolName?: string;
  /** The tool arguments chunk (present for tool_call_args). */
  toolArgs?: string;
  /** The tool result (present for tool_call_result). */
  toolResult?: string;
  /** Raw event data from the SDK. */
  raw?: unknown;
}

// ---------------------------------------------------------------------------
// Streaming store (module-level, shared between service and bubbles)
// ---------------------------------------------------------------------------

/** Internal streaming state per message ID. */
export interface CometChatStreamState {
  /** Accumulated text content. */
  text: string;
  /** Whether the stream has completed. */
  isComplete: boolean;
  /** Name of the currently executing tool call (null if none). */
  activeToolCall: string | null;
  /** Tool execution text (from event data or localized fallback). */
  toolExecutionText: string;
  /** Whether the AI is in the "thinking" state (run_started, before first text). */
  isThinking: boolean;
  /** Whether there is any streamed content yet. */
  hasContent: boolean;
  /** Whether an offline/network error occurred. */
  hasError: boolean;
  /** Whether the stream has started at all. */
  hasStarted: boolean;
  /** The run ID of the currently active stream (used to scope bubbles). */
  currentRunId: string;
}

// ---------------------------------------------------------------------------
// AI Assistant Bubble (completed messages)
// ---------------------------------------------------------------------------

/** Props for CometChatAIAssistantBubble. */
export interface CometChatAIAssistantBubbleProps {
  /** The AI assistant message to render. */
  message: CometChat.BaseMessage;
  /** Bubble alignment — 'left' for incoming, 'right' for outgoing. */
  alignment?: 'left' | 'right';
  /** Optional custom className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Stream Message Bubble (live streaming)
// ---------------------------------------------------------------------------

/** Props for CometChatStreamMessageBubble. */
export interface CometChatStreamMessageBubbleProps {
  /**
   * The chat ID (user UID or group GUID) this stream belongs to.
   * Used to scope stream events to the correct conversation.
   */
  chatId: string;
  /**
   * Optional run ID to filter events when multiple runs are in flight.
   * When omitted, the bubble subscribes to the latest run for this chatId.
   */
  runId?: string;
  /** Bubble alignment — 'left' for incoming, 'right' for outgoing. */
  alignment?: 'left' | 'right';
  /** Optional custom className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Tool Call Argument Bubble
// ---------------------------------------------------------------------------

/** Props for CometChatToolCallArgumentBubble. */
export interface CometChatToolCallArgumentBubbleProps {
  /** The AI tool argument message to render. */
  message: CometChat.BaseMessage;
  /** Optional custom className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Tool Call Result Bubble
// ---------------------------------------------------------------------------

/** Props for CometChatToolCallResultBubble. */
export interface CometChatToolCallResultBubbleProps {
  /** The AI tool result message to render. */
  message: CometChat.BaseMessage;
  /** Optional custom className. */
  className?: string;
}

// ---------------------------------------------------------------------------
// AI Assistant Chat History (sidebar)
// ---------------------------------------------------------------------------

/** Props for CometChatAIAssistantChatHistory. */
export interface CometChatAIAssistantChatHistoryProps {
  /** The AI assistant user. */
  user?: CometChat.User;
  /** The AI assistant group (alternative to user). */
  group?: CometChat.Group;
  /** Whether to hide the "New Chat" button. Default: false (show new chat by default). */
  hideNewChat?: boolean;
  /** Auto-load the most recent conversation on mount. Default: false. */
  loadLastAgentConversation?: boolean;
  /** Callback when a message is clicked (loads that conversation). */
  onMessageClick?: (message: CometChat.TextMessage) => void;
  /** Callback when "New Chat" is clicked. */
  onNewChatClick?: (message?: CometChat.TextMessage | null) => void;
  /** Callback when the close button is clicked. */
  onClose?: () => void;
  /** Callback when the history is empty. */
  onEmpty?: () => void;
  /** Callback when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Custom empty state template. */
  emptyStateView?: ReactNode;
  /** Custom error state template. */
  errorStateView?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Imperative handle exposed by CometChatAIAssistantChatHistory via ref. */
export interface CometChatAIAssistantChatHistoryHandle {
  /** Add a message to the top of the history list (used when a new message is sent). */
  addMessage: (message: CometChat.TextMessage) => void;
}

// ---------------------------------------------------------------------------
// AI Assistant Chat (full orchestrator)
// ---------------------------------------------------------------------------

/** Props for CometChatAIAssistantChat. */
export interface CometChatAIAssistantChatProps {
  /** Required: the AI assistant user. */
  user: CometChat.User;
  /** Streaming speed in ms between text chunks. Default: 30. */
  streamingSpeed?: number;
  /** Tool handlers for function calls. */
  aiAssistantTools?: CometChatAIAssistantTools;
  /** Auto-load the most recent conversation on mount. Default: false. */
  loadLastAgentConversation?: boolean;
  /** Whether to hide suggestion pills. Default: false. */
  hideSuggestedMessages?: boolean;
  /** Custom suggestion texts (overrides user metadata). */
  suggestedMessages?: string[];
  /** Custom image view for the empty chat state. */
  emptyChatImageView?: ReactNode;
  /** Custom greeting message view for the empty chat state. */
  emptyChatGreetingView?: ReactNode;
  /** Custom intro message view for the empty chat state. */
  emptyChatIntroMessageView?: ReactNode;
  /** Whether to hide the chat history sidebar button. Default: false. */
  hideChatHistory?: boolean;
  /** Whether to hide the "New Chat" button. Default: false. */
  hideNewChat?: boolean;
  /** Whether to show the back button in the header. Default: false. */
  showBackButton?: boolean;
  /** Whether to show the close button in the header. Default: false. */
  showCloseButton?: boolean;
  /** Callback when the back button is clicked. */
  onBackButtonClicked?: () => void;
  /** Callback when the close button is clicked. */
  onCloseButtonClicked?: () => void;
  /** Callback when a message is sent. */
  onSendButtonClick?: (message: CometChat.BaseMessage) => void;
  /** Custom empty state view (replaces default greeting). */
  emptyView?: ReactNode;
  /** Custom loading view. */
  loadingView?: ReactNode;
  /** Custom error view. */
  errorView?: ReactNode;
  /** Callback when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Optional custom className. */
  className?: string;
  /** Parent message ID to load a specific conversation thread. */
  parentMessageId?: number;
  /** Custom header item view (replaces entire header). */
  headerItemView?: ReactNode;
  /** Custom header title view. */
  headerTitleView?: ReactNode;
  /** Custom header subtitle view. */
  headerSubtitleView?: ReactNode;
  /** Custom header leading view (avatar area). */
  headerLeadingView?: ReactNode;
  /** Custom header trailing view. */
  headerTrailingView?: ReactNode;
  /** Custom header auxiliary button view. */
  headerAuxiliaryButtonView?: ReactNode;
}

// ---------------------------------------------------------------------------
// AI Assistant Tools
// ---------------------------------------------------------------------------

/** Type for a tool action function. */
export type CometChatAIAssistantToolFunction = (args: Record<string, unknown>) => void;

/** Map of tool name → handler function. */
export type CometChatAIAssistantToolsMap = Record<string, CometChatAIAssistantToolFunction>;

/**
 * CometChatAIAssistantTools — maps tool function names to handler functions.
 * Plain model class (not a service).
 */
export class CometChatAIAssistantTools {
  private readonly actionsMap: CometChatAIAssistantToolsMap;

  constructor(actions: CometChatAIAssistantToolsMap) {
    this.actionsMap = Object.assign(Object.create(null) as CometChatAIAssistantToolsMap, actions);
  }

  /** Returns the handler for the given tool name, or undefined if not registered. */
  getAction(name: string): CometChatAIAssistantToolFunction | undefined {
    return this.actionsMap[name];
  }

  /** Returns a shallow copy of all registered actions. */
  getActions(): CometChatAIAssistantToolsMap {
    return Object.assign({}, this.actionsMap);
  }
}

// ---------------------------------------------------------------------------
// AI Plugin
// ---------------------------------------------------------------------------

/**
 * Configuration for the AI plugin.
 * Passed to createCometChatAIPlugin().
 */
export interface CometChatAIPluginConfig {
  /**
   * Whether to enable the AI assistant chat panel.
   * Default: true.
   */
  enableAssistantPanel?: boolean;
  /**
   * Whether to enable smart replies in the composer.
   * Default: true.
   */
  enableSmartReplies?: boolean;
  /**
   * Whether to enable conversation summary in the message header.
   * Default: true.
   */
  enableConversationSummary?: boolean;
  /**
   * Whether to enable conversation starters in the message list empty state.
   * Default: true.
   */
  enableConversationStarters?: boolean;
  /**
   * Custom icon URL for the AI button in the composer.
   */
  aiButtonIconURL?: string;
}
