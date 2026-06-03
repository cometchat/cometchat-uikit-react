import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import { CometChatDeleteBubble } from './CometChatDeleteBubble';

/**
 * Core plugin for deleted messages.
 *
 * Special: messageTypes and messageCategories are empty because the
 * PluginRegistry matches deleted messages by checking getDeletedAt()
 * before type/category matching. This plugin is always resolved via
 * the registry's deleted-message fast path, not by type+category.
 *
 * Renders CometChatDeleteBubble with sender/receiver styling.
 * No context menu options — deleted messages have no actions.
 */
export const CometChatDeletePlugin: CometChatMessagePlugin = {
  id: 'delete',
  messageTypes: [],
  messageCategories: [],

  renderBubble(_message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const isSentByMe = context.alignment === 'right';
    return React.createElement(CometChatDeleteBubble, { isSentByMe });
  },

  getOptions(): CometChatMessageOption[] {
    return [];
  },

  getLastMessagePreview(
    _message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    return t?.('message_deleted') ?? 'This message was deleted';
  },
};
