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
import copyIcon from '../../assets/Copy.svg';

/**
 * Extract the plain text content of an AI assistant message.
 * Prefers AIAssistantMessage.getAssistantMessageData().getText(), then falls back
 * to TextMessage.getText() and finally data.text / data.content.
 */
function extractAssistantText(message: CometChat.BaseMessage): string {
  try {
    const msgWithData = message as unknown as {
      getAssistantMessageData?: () => { getText?: () => string };
    };
    const assistantText = msgWithData.getAssistantMessageData?.()?.getText?.();
    if (assistantText) return assistantText;

    if (
      'getText' in message &&
      typeof (message as { getText: () => string }).getText === 'function'
    ) {
      const text = (message as { getText: () => string }).getText();
      if (text) return text;
    }

    const data = (message as unknown as { data?: { text?: string; content?: string } }).data;
    if (data?.text) return data.text;
    if (data?.content) return data.content;
  } catch {
    // fall through
  }
  return '';
}

/**
 * Build the conversation-list preview text for an AI assistant message.
 *
 * Ported from v6 `ConversationUtils.getLastAgenticMessage`: prefer the message's
 * element list — concatenating each element's text, and a card element's
 * `fallbackText` — falling back to the assistant message data text when the
 * SDK doesn't expose elements (current baseline) or the list is empty.
 */
function getLastAgenticMessageText(message: CometChat.BaseMessage): string {
  const withElements = message as unknown as {
    getElements?: () => { getType?: () => string; getData?: () => unknown }[] | undefined;
  };
  const elements = withElements.getElements?.() ?? [];

  if (Array.isArray(elements) && elements.length > 0) {
    return elements
      .reduce((acc, element) => {
        const data = element.getData?.() as
          | string
          | { text?: string; card?: { fallbackText?: string }; fallbackText?: string }
          | undefined;

        if (element.getType?.() === 'card') {
          const card =
            data && typeof data === 'object'
              ? ((data.card ?? data) as { fallbackText?: string })
              : undefined;
          return card?.fallbackText ? `${acc}${card.fallbackText} ` : acc;
        }

        const text = typeof data === 'string' ? data : (data?.text ?? '');
        return `${acc}${text} `;
      }, '')
      .trim();
  }

  // No elements (or unsupported by the SDK) — fall back to the assistant text.
  return extractAssistantText(message);
}

/** Resolve a localization key with a fallback (localization returns the key when missing). */
function loc(context: CometChatMessagePluginContext, key: string, fallback: string): string {
  const result = context.getLocalizedString?.(key);
  return result && result !== key ? result : fallback;
}

/**
 * Copy-only context menu option for group agent messages.
 * Copies the assistant's plain text (the agent reply has no react/reply/edit/delete).
 */
function createCopyOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: CometChatUIKitConstants.MessageOption.copyMessage,
    title: loc(context, 'message_list_option_copy', 'Copy'),
    iconURL: copyIcon,
    onClick: message => {
      const text = extractAssistantText(message);
      if (!text) return;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(text);
      }
      context.showToast?.(
        loc(context, 'message_list_message_copied', 'Message copied to clipboard.')
      );
    },
  };
}

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
        message,
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

    // AI assistant messages (completed, with markdown).
    // The bubble decides its own copy affordance from the message's receiver
    // type: an inline copy button in 1:1, none in groups (which use the
    // context-menu copy from getOptions). No flag is passed from here.
    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatAIAssistantBubble, {
        message,
        alignment,
      })
    );
  },

  // Suppress the status-info view (timestamp + receipts) for agent messages —
  // mirrors V6, where the agentic template set `statusInfoView: undefined`.
  renderStatusInfoView(): null {
    return null;
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    // Completed AI assistant replies in a GROUP expose a copy-only context menu
    // (no edit, delete, reply, or reactions). 1:1 AI assistant chat uses the
    // inline copy button inside the bubble instead, so it gets no options.
    const isGroup = message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group;
    if (isGroup && message.getType() === CometChatUIKitConstants.MessageTypes.assistant) {
      return [createCopyOption(context)];
    }
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

      // assistant type — build preview from message elements (v6 parity), with
      // a fallback to the assistant message data text.
      const assistantText = getLastAgenticMessageText(message);
      if (assistantText) {
        // Strip markdown for plain-text preview
        const plain = assistantText.replace(/[#*`_~[\]()>]/g, '').trim();
        return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
      }
    } catch {
      // fall through
    }
    return 'AI message';
  },
};
