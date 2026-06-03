import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePlugin, CometChatMessageOption } from '../../plugin.types';
import { CometChatActionBubble } from '../../../components/CometChatActionBubble';
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
    // getActionMessageText handles localization internally when getLocalizedString() is available.
    // At render time, the bubble component will use useLocale() for the final text.
    // Here we pass the raw action message — the bubble receives pre-computed text.
    const messageText = getActionMessageText(message);

    return React.createElement(CometChatActionBubble, {
      messageText,
    });
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
