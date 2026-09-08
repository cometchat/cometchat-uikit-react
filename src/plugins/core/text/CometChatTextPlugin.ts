import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { CometChatMentionsFormatter } from '../../../formatters/CometChatMentionsFormatter';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';
import { mergeFormatters } from '../../../formatters/mergeFormatters';
import { createDefaultTextFormatters } from '../shared/defaultTextFormatters';
import { CometChatTextBubble } from '../../../components/CometChatTextBubble/CometChatTextBubble';
import { getTextMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for text messages.
 *
 * Handles message type 'text' in category 'message'.
 * Renders CometChatTextBubble with mentions + URL + markdown formatting.
 *
 * 1. convertFormattingHtmlToMarkdown(text) — normalizes any HTML formatting to markdown
 * 2. sanitizeText(markdownText) — escapes remaining dangerous HTML
 * 3. Run formatters (markdown → mentions → URLs) in priority order
 */
export const CometChatTextPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: [CometChatUIKitConstants.MessageTypes.text],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    // The bubble extracts the text (getText()) and configures mention formatting
    // from the message itself. The plugin only supplies the formatter instances,
    // alignment, and truncation flag.
    const own = this.getTextFormatters ? this.getTextFormatters() : [];
    // Merge the plugin's own formatters (markdown/mentions/url) with any custom display
    // formatters supplied at the MessageList level.
    const formatters = mergeFormatters(own, context.textFormatters ?? []);

    return React.createElement(CometChatTextBubble, {
      message: message as CometChat.TextMessage,
      isSentByMe: context.alignment === 'right',
      textFormatters: formatters,
      disableTruncation: context.disableTruncation,
    });
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    return getTextMessageOptions(message, context);
  },

  getLastMessagePreview(message: CometChat.BaseMessage, loggedInUser: CometChat.User): string {
    const textMessage = message as CometChat.TextMessage;
    const text = textMessage.getText();
    if (!text) return '';

    const markdownFormatter = new CometChatMarkdownFormatter();
    let preview = markdownFormatter.stripMarkdownForConversation(text);

    const mentionsFormatter = new CometChatMentionsFormatter();
    const mentionedUsers = textMessage.getMentionedUsers();
    mentionsFormatter.setLoggedInUser(loggedInUser);
    if (mentionedUsers.length > 0) {
      mentionsFormatter.setUsers(mentionedUsers);
    }
    preview = mentionsFormatter.formatSdkMentions(preview, mentionedUsers);

    preview = preview.replace(/\n/g, ' ').trim();

    return preview;
  },

  getTextFormatters(): CometChatTextFormatter[] {
    return createDefaultTextFormatters();
  },
};
