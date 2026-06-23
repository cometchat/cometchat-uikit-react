import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePlugin, CometChatMessageOption } from '../../plugin.types';
import { CometChatGroupActionBubble } from '../../../components/CometChatGroupActionBubble';
import { getActionMessageText } from '../shared/CometChatActionMessageUtils';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for group action messages (member joined, left, kicked, banned, etc.).
 *
 * These are system messages rendered as centered, pill-shaped bubbles.
 * They have no context menu options.
 *
 * Uses the shared getActionMessageText() utility for localized action text
 * generation, which is also reusable by the future Calling plugin.
 */
export const CometChatGroupActionPlugin: CometChatMessagePlugin = {
  id: 'group-action',
  messageTypes: [CometChatUIKitConstants.MessageTypes.groupMember],
  messageCategories: [CometChatUIKitConstants.MessageCategory.action],

  renderBubble(message: CometChat.BaseMessage) {
    // The bubble extracts and localizes the action text itself (via useLocale).
    return React.createElement(CometChatGroupActionBubble, { message });
  },

  getOptions(): CometChatMessageOption[] {
    return [];
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    const text = getActionMessageText(message);
    if (text.length > 100) {
      return text.slice(0, 100) + '…';
    }
    return text || (t?.('message_list_action_joined') ?? 'Group action');
  },
};
