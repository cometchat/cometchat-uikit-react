/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unnecessary-condition */
/**
 * CometChatAIPlugin
 *
 * Extension plugin for AI assistant messages.
 * Handles three message types in the 'agentic' category:
 *   - 'assistant'      → CometChatAIAssistantBubble (completed AI response with markdown)
 *   - 'toolArguments'  → CometChatToolCallArgumentBubble (tool call arguments as JSON)
 *   - 'toolResults'    → CometChatToolCallResultBubble (tool call results as JSON)
 *
 * Also provides:
 *   - getLastMessagePreview() → conversation list subtitle
 *
 * Lazy loading:
 *   - All three bubble components are lazy-loaded (kept out of the initial bundle)
 *   - CometChatAIAssistantChat is Tier 4 lazy (loaded on first open)
 *   - Preloaded on AI button hover/focus via preloadAIAssistantChat()
 *
 * @example
 * ```tsx
 * import { CometChatAIPlugin } from '@cometchat/chat-uikit-react/plugins/ai';
 *
 * <CometChatProvider plugins={[...defaultPlugins, CometChatAIPlugin]}>
 *   ...
 * </CometChatProvider>
 * ```
 */

import React, { lazy, Suspense } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../plugin.types';
import { AI_CONSTANTS } from './ai.constants';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { CometChatStreamMessageBubble } from '../../components/CometChatAIAssistantChat/CometChatStreamMessageBubble';

// Lazy-load all bubble components — keeps them out of the initial bundle
const LazyCometChatAIAssistantBubble = lazy(
  () => import('../../components/CometChatAIAssistantChat/CometChatAIAssistantBubble')
);
const LazyCometChatToolCallArgumentBubble = lazy(
  () => import('../../components/CometChatAIAssistantChat/CometChatToolCallArgumentBubble')
);
const LazyCometChatToolCallResultBubble = lazy(
  () => import('../../components/CometChatAIAssistantChat/CometChatToolCallResultBubble')
);

/**
 * Preload function for the AI assistant chat.
 * Called on AI button hover/focus to reduce perceived latency.
 */
export const preloadAIAssistantChat = (): Promise<unknown> =>
  import('../../components/CometChatAIAssistantChat/CometChatAIAssistantChat.lazy');

/**
 */
export const preloadAIAssistantPanel = preloadAIAssistantChat;

/**
 * CometChatAIPlugin — implements CometChatMessagePlugin for AI assistant messages.
 */
export const CometChatAIPlugin: CometChatMessagePlugin = {
  id: AI_CONSTANTS.pluginId,

  messageTypes: [
    CometChatUIKitConstants.MessageTypes.assistant,
    CometChatUIKitConstants.MessageTypes.toolArguments,
    CometChatUIKitConstants.MessageTypes.toolResults,
    // run_started is the streaming bubble placeholder added when a message is sent in agent chat
    CometChatUIKitConstants.streamMessageTypes.run_started,
  ],

  messageCategories: [
    CometChatUIKitConstants.MessageCategory.agentic,
    // run_started messages have category 'custom'
    CometChatUIKitConstants.MessageCategory.custom,
  ],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    const type = message.getType();

    // Streaming bubble — shown while AI is generating a response
    // This is a fake message added to the list when a message is sent in agent chat
    if (type === CometChatUIKitConstants.streamMessageTypes.run_started) {
      // The streaming service is keyed by chatId, so this connects to the right stream.
      const chatId = message.getReceiverId() || '';
      const data = (
        message as unknown as { getData?: () => { runId?: string | number } }
      ).getData?.();
      const runId = data?.runId != null ? String(data.runId) : undefined;
      return React.createElement(CometChatStreamMessageBubble, {
        chatId,
        runId,
        alignment,
      });
    }

    // Tool call argument messages
    if (type === CometChatUIKitConstants.MessageTypes.toolArguments) {
      return React.createElement(
        Suspense,
        { fallback: null },
        React.createElement(LazyCometChatToolCallArgumentBubble, { message })
      );
    }

    // Tool call result messages
    if (type === CometChatUIKitConstants.MessageTypes.toolResults) {
      return React.createElement(
        Suspense,
        { fallback: null },
        React.createElement(LazyCometChatToolCallResultBubble, { message })
      );
    }

    // AI assistant messages (completed, with markdown)
    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatAIAssistantBubble, {
        message,
        alignment,
      })
    );
  },

  getOptions(
    _message: CometChat.BaseMessage,
    _context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    // AI assistant messages have no context menu options.
    // They are system-generated — no edit, delete, reply, or reactions.
    return [];
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    try {
      const type = message.getType();

      if (type === CometChatUIKitConstants.MessageTypes.toolArguments) {
        return 'Tool call';
      }

      if (type === CometChatUIKitConstants.MessageTypes.toolResults) {
        return 'Tool result';
      }

      // assistant type — extract text from AIAssistantMessage
      const msgWithData = message as unknown as {
        getAssistantMessageData?: () => { getText?: () => string };
      };
      const assistantText = msgWithData.getAssistantMessageData?.()?.getText?.();
      if (assistantText) {
        // Strip markdown for plain-text preview
        const plain = assistantText.replace(/[#*`_~[\]()>]/g, '').trim();
        return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
      }

      // Fallback: getText() for TextMessage
      if ('getText' in message) {
        const text = (message as CometChat.TextMessage).getText();
        if (text) {
          return text.length > 80 ? `${text.slice(0, 80)}…` : text;
        }
      }
    } catch {
      // fall through
    }
    return 'AI message';
  },
};
