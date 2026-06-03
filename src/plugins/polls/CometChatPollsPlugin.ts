/**
 * CometChatPollsPlugin
 *
 * Extension plugin for poll messages.
 * Handles message type 'extension_poll' in category 'custom'.
 * Renders CometChatPollBubble with poll question, options, and voting.
 */

import React, { lazy, Suspense } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../plugin.types';
import { getMediaMessageOptions } from '../core/shared/CometChatMessageOptions';
import { POLLS_CONSTANTS } from './polls.constants';

// Lazy-load the bubble component — keeps it out of the initial bundle
const LazyCometChatPollBubble = lazy(() => import('./CometChatPollBubble'));

export const CometChatPollsPlugin: CometChatMessagePlugin = {
  id: 'polls',
  messageTypes: [POLLS_CONSTANTS.messageType],
  messageCategories: ['custom'],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const customMessage = message as CometChat.CustomMessage;
    const alignment = context.alignment === 'right' ? 'right' : 'left';

    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatPollBubble, {
        message: customMessage,
        alignment,
        loggedInUser: context.loggedInUser,
      })
    );
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    return getMediaMessageOptions(message, context);
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    try {
      const customMessage = message as CometChat.CustomMessage;
      const customData = customMessage.getCustomData() as Record<string, unknown> | undefined;
      const question = customData?.question as string | undefined;
      if (question && question.length > 0) {
        return question.length > 80 ? `${question.slice(0, 80)}…` : question;
      }
    } catch {
      // fall through
    }
    return t?.('conversation_subtitle_poll') ?? 'Poll';
  },
};
