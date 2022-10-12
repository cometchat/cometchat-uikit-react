import heart from "./resources/heart.png";

import { MessageComposerConfiguration } from "../CometChatMessageComposer/MessageComposerConfiguration";
import { MessageHeaderConfiguration } from "../CometChatMessageHeader/MessageHeaderconfiguration";
import { LiveReactionConfiguration } from "../CometChatLiveReactions/LiveReactionConfiguration";
import { MessageListConfiguration } from "../CometChatMessageList/MessageListConfiguration";
import { MessagesStyles } from "./MessagesStyles";

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
    style = new MessagesStyles({}),
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
    this.style = new MessagesStyles(style || {});
    this.messageHeaderConfiguration = messageHeaderConfiguration;
    this.messageListConfiguration = messageListConfiguration;
    this.messageComposerConfiguration = messageComposerConfiguration;
  }
}

export { MessagesConfiguration };
