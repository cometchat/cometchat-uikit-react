import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import { CometChatCardBubble } from './CometChatCardBubble';
import { getTextMessageOptions, MESSAGE_OPTION_IDS } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for developer card messages.
 *
 * Handles card messages (type `card`, category `MessageCategory.card`).
 *
 * `messageTypes` must list `card` explicitly: the messages API AND-filters
 * category against the request's `types` list, so a card-category message is
 * only fetched when `card` is present in `types`. An empty `messageTypes` would
 * act as a render-only wildcard but contribute nothing to the request builder,
 * causing card messages to be filtered out of thread/list responses.
 *
 * Render-only & additive: mirrors `CometChatTextPlugin`. The only differences
 * from the text plugin are (a) the content is drawn by `CometChatCardBubble`
 * (the prebuilt card renderer) and (b) the `edit` and `copy` options are
 * suppressed — every other option (and its per-option conditions) is inherited
 * from the text option set.
 */
export const CometChatCardBubblePlugin: CometChatMessagePlugin = {
  id: 'card',
  messageTypes: [CometChatUIKitConstants.MessageTypes.card],
  messageCategories: [CometChatUIKitConstants.MessageCategory.card],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    return React.createElement(CometChatCardBubble, {
      message: message as CometChat.CardMessage,
      themeMode: context.theme,
    });
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    // Reuse the text option set (preserving its per-option conditions) minus edit + copy.
    return getTextMessageOptions(message, context).filter(
      option => option.id !== MESSAGE_OPTION_IDS.edit && option.id !== MESSAGE_OPTION_IDS.copy
    );
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    const text = (message as CometChat.CardMessage).getText();
    if (text) return text.replace(/\n/g, ' ').trim();
    const localized = t?.('card_message_fallback');
    return localized && localized !== 'card_message_fallback' ? localized : 'Card Message';
  },
};
