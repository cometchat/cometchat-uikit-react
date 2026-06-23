/**
 * AI Plugin — plugin logic, streaming service, types, and constants.
 *
 * This is the canonical location for AI plugin infrastructure.
 * UI components (bubbles, chat panel, history) remain in
 * `src/components/CometChatAIAssistantChat/`.
 *
 * @example
 * ```ts
 * import {
 *   CometChatAIPlugin,
 *   CometChatAIAssistantTools,
 *   preloadAIAssistantChat,
 * } from '@cometchat/chat-uikit-react';
 * ```
 */

// Plugin registration
export {
  CometChatAIPlugin,
  preloadAIAssistantChat,
  preloadAIAssistantPanel,
} from './CometChatAIPlugin';

// Streaming service
export {
  handleWebsocketMessage,
  startStreamingMessage,
  stopStreamingMessage,
  setStreamSpeed,
  getStreamSpeed,
  setAIAssistantTools,
  getAIAssistantTools,
  getStreamState,
  subscribeToStreamState,
  setStreamError,
  isStreaming,
} from '../../components/CometChatAIAssistantChat/CometChatAIStreamingService';

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
  CometChatAIPluginConfig,
} from '../../components/CometChatAIAssistantChat/ai.types';

// Model class (value export)
export { CometChatAIAssistantTools } from '../../components/CometChatAIAssistantChat/ai.types';

// Constants
export { AI_CONSTANTS } from './ai.constants';
