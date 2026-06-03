/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-vars */
/**
 * CometChatMessageTranslationPlugin
 *
 * Lightweight extension plugin that adds a "Translate" option to text messages.
 * Does NOT own a message type — it enhances text messages by adding a context
 * menu option that triggers translation via the CometChat extension API.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../plugin.types';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { translateMessage } from '../../utils/CometChatTranslationUtils';

const TRANSLATE_OPTION_ID = 'translate';

export const CometChatMessageTranslationPlugin: CometChatMessagePlugin = {
  id: 'message-translation',
  messageTypes: [],
  messageCategories: [],

  renderBubble() {
    return null;
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    if (message.getType() !== CometChatUIKitConstants.MessageTypes.text || message.getDeletedAt()) {
      return [];
    }

    return [
      {
        id: TRANSLATE_OPTION_ID,
        title: context.getLocalizedString?.('message_list_translate') ?? 'Translate',
        onClick: (msg: CometChat.BaseMessage) => {
          const textMessage = msg as CometChat.TextMessage;
          const browserLang = (navigator.language || 'en').split('-')[0];
          void translateMessage(textMessage, browserLang).then(translatedText => {
            if (translatedText) {
              const metadata = (textMessage.getMetadata() ?? {}) as Record<string, unknown>;
              metadata.translated_message = translatedText;
              textMessage.setMetadata(metadata);
            }
          });
        },
      },
    ];
  },

  getLastMessagePreview(
    _message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    _t?: (key: string) => string
  ): string {
    return '';
  },
};
