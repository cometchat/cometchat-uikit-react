/**
 * AI Plugin public API
 *
 * Import from this path:
 * ```ts
 * import {
 *   CometChatAIPlugin,
 *   CometChatAIAssistantChat,
 *   CometChatAIAssistantTools,
 *   preloadAIAssistantChat,
 * } from '@cometchat/chat-uikit-react/plugins/ai';
 * ```
 */

// Plugin
export {
  CometChatAIPlugin,
  preloadAIAssistantChat,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  preloadAIAssistantPanel,
} from './CometChatAIPlugin';

// Streaming service (for advanced usage)
export {
  handleWebsocketMessage,
  startStreamingMessage,
  stopStreamingMessage,
  setStreamSpeed,
  setAIAssistantTools,
  getStreamState,
  subscribeToStreamState,
  setStreamError,
  isStreaming,
} from './CometChatAIStreamingService';

// Bubble components
export { CometChatAIAssistantBubble } from './CometChatAIAssistantBubble';
export { CometChatStreamMessageBubble } from './CometChatStreamMessageBubble';
export { CometChatToolCallArgumentBubble } from './CometChatToolCallArgumentBubble';
export { CometChatToolCallResultBubble } from './CometChatToolCallResultBubble';

// Chat history sidebar
export { CometChatAIAssistantChatHistory } from './CometChatAIAssistantChatHistory';

// Full AI assistant chat orchestrator
export { CometChatAIAssistantChat } from './CometChatAIAssistantChat';

// Types
export type {
  CometChatAIStreamEventType,
  CometChatAIStreamEvent,
  CometChatStreamState,
  CometChatAIAssistantBubbleProps,
  CometChatStreamMessageBubbleProps,
  CometChatToolCallArgumentBubbleProps,
  CometChatToolCallResultBubbleProps,
  CometChatAIAssistantChatHistoryProps,
  CometChatAIAssistantChatProps,
  CometChatAIAssistantToolFunction,
  CometChatAIAssistantToolsMap,
} from './ai.types';

// Model class (not a type — needs to be a value export)
export { CometChatAIAssistantTools } from './ai.types';

// Constants
export { AI_CONSTANTS } from './ai.constants';
