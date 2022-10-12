import { MessageBubbleConfiguration } from "../Bubbles/CometChatMessageBubble/MessageBubbleConfiguration";
import { DateConfiguration } from "../../Shared/PrimaryComponents/CometChatConfiguration/DateConfiguration";
import { NewMessageIndicatorConfiguration } from "../CometChatNewMessageIndicator/NewMessageIndicatorConfiguration"
import { SmartRepliesConfiguration } from "../CometChatSmartReplies/SmartRepliesConfiguration"
import { EmojiKeyboardConfiguration } from "../CometChatEmojiKeyboard/EmojiKeyboardConfiguration"
import { MessageInputData} from "../../Shared/InputData/MessageInputData"
import loadingIcon from "./resources/spinner.svg"
import { MessageListAlignmentConstants } from "../../Shared";

/**
 * @class MessageListConfiguration
 * @description MessageListConfiguration class is used for defining the MessageList templates.
 * @param {String} alignment
 * @param {Array} messageTypes
 * @param {Array} excludeMessageOptions
 * @param {Array} excludeMessageTypes
 * @param {Array} customMessageOptions
 * @param {Number} limit
 * @param {Boolean} onlyUnread
 * @param {Boolean} hideMessagesFromBlockedUsers
 * @param {Boolean} hideDeletedMessages
 * @param {Array} tags
 * @param {String} loadingIconURL
 * @param {String} customView
 * @param {Boolean} hideError
 * @param {Boolean} enableSoundForMessages
 * @param {String} customIncomingMessageSound
 * @param {Object} sentMessageInputData
 * @param {Object} receivedMessageInputData
 * @param {Object} messageBubbleConfiguration
 * @param {Object} dateConfiguration
 * @param {Object} smartRepliesConfiguration
 * @param {Object} emojiKeyboardConfiguration
 */

class MessageListConfiguration {
  constructor({
    alignment = MessageListAlignmentConstants.standard,
    messageTypes = null,
    excludeMessageTypes = null,
    excludeMessageOptions = null,
    customMessageOptions = null,
    limit = 30,
    onlyUnread = false,
    hideMessagesFromBlockedUsers = false,
    hideDeletedMessages = false,
    tags = null,
    loadingIconURL = loadingIcon,
    customView = null,
    hideError = null,
    enableSoundForMessages = true,
    customIncomingMessageSound = null,
    sentMessageInputData = new MessageInputData({
      id: true,
      title: null,
      thumbnail: null,
      readReceipt: null,
      timestamp: null
    }),
    receivedMessageInputData = new MessageInputData({id: true,
      title: null,
      thumbnail: null,
      readReceipt: null,
      timestamp: null}),
    messageBubbleConfiguration = new MessageBubbleConfiguration({}),
    newMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration({}),
    dateConfiguration = new DateConfiguration({}),
    smartRepliesConfiguration = new SmartRepliesConfiguration({}),
    emojiKeyboardConfiguration = new EmojiKeyboardConfiguration({})
  }) {
    this.limit = limit;
    this.onlyUnread = onlyUnread;
    this.messageTypes = messageTypes;
    this.customMessageOptions = customMessageOptions;
    this.alignment = alignment;
    this.tags = tags;
    this.hideError = hideError;
    this.customView = customView;
    this.loadingIconURL = loadingIconURL;
    this.receivedMessageInputData = new MessageInputData(receivedMessageInputData || {});
    this.sentMessageInputData = new MessageInputData(sentMessageInputData || {});
    this.hideDeletedMessages = hideDeletedMessages;
    this.hideMessagesFromBlockedUsers = hideMessagesFromBlockedUsers;
    this.excludeMessageTypes = excludeMessageTypes;
    this.customIncomingMessageSound = customIncomingMessageSound;
    this.enableSoundForMessages = enableSoundForMessages;
    this.excludeMessageOptions = excludeMessageOptions;
    this.messageBubbleConfiguration = new MessageBubbleConfiguration(messageBubbleConfiguration || {});
    this.newMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration(newMessageIndicatorConfiguration ||{});
    this.dateConfiguration = new DateConfiguration(dateConfiguration || {});
    this.smartRepliesConfiguration = new SmartRepliesConfiguration(smartRepliesConfiguration || {});
    this.emojiKeyboardConfiguration = new EmojiKeyboardConfiguration(emojiKeyboardConfiguration || {});
  }
}

export { MessageListConfiguration };
