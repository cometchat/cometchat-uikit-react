import heart from "./resources/heart.png";

import { MessageComposerConfiguration } from "../CometChatMessageComposer/MessageComposerConfiguration";
import { MessageHeaderConfiguration } from "../CometChatMessageHeader/MessageHeaderConfiguration";
import { MessageListConfiguration } from "../CometChatMessageList/MessageListConfiguration";
import { MessagesStyle } from "./MessagesStyle";

/**
 * @class MessagesConfiguration
 * @description MessagesConfiguration class is used for defining the Messages templates.
 * @param {String} liveReactionIconURL
 * @param {boolean} customOutgoingMessageSound
 * @param {Boolean} enableSoundForMessages
 * @param {Boolean} enableSoundForCalls
 * @param {Boolean} customIncomingMessageSound
 * @param {Boolean} enableTypingIndicator
 * @param {Array} messageTypes
 * @param {Object} parentMessage
 * @param {Object} messageHeaderConfiguration
 * @param {Object}messageListConfiguration
 * @param {Object} messageComposerConfiguration
 * @param {Object} style
 */

class MessagesConfiguration {
  constructor({
    messageTypes = null,
    hideMessageComposer = false,
    enableSoundForMessages = true,
    enableSoundForCalls = true,
    customIncomingMessageSound = true,
    customOutgoingMessageSound = true,
    enableTypingIndicator = true,
    liveReactionIconURL = heart,
    style = new MessagesStyle({}),
    messageHeaderConfiguration = new MessageHeaderConfiguration({}),
    messageListConfiguration = new MessageListConfiguration({}),
    messageComposerConfiguration = new MessageComposerConfiguration({}),
  }) {
    this.messageTypes = messageTypes;
    this.hideMessageComposer = hideMessageComposer;
    this.enableTypingIndicator = enableTypingIndicator;
    this.liveReactionIconURL = liveReactionIconURL;
    this.customIncomingMessageSound = customIncomingMessageSound;
    this.customOutgoingMessageSound = customOutgoingMessageSound;
    this.enableSoundForMessages = enableSoundForMessages;
    this.enableSoundForCalls = enableSoundForCalls;
    this.style = new MessagesStyle(style || {});
    this.messageHeaderConfiguration = messageHeaderConfiguration;
    this.messageListConfiguration = messageListConfiguration;
    this.messageComposerConfiguration = messageComposerConfiguration;
  }
}

export { MessagesConfiguration };
