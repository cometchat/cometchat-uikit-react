import { ConversationInputData } from "../../../Chats";
import { ConversationListItemStyle } from "./ConversationListItemStyle";
import {
  AvatarConfiguration,
  BadgeCountConfiguration,
  StatusIndicatorConfiguration,
  MessageReceiptConfiguration,
  DateConfiguration,
} from "../..";

/**
 * @class ConversationListItemConfiguration
 * @description ConversationListItemConfiguration class is used for defining the ConversationListItem templates.
 * @param {Object} conversationInputData
 * @param {Object} style
 * @param {Boolean} showTypingIndicator
 * @param {String} typingIndicatorText
 * @param {Boolean} hideThreadIndicator
 * @param {Boolean} hideGroupActions
 * @param {Boolean} hideDeletedMessages
 * @param {String} threadIndicatorText
 * @param {Array} conversationOptions
 * @param {Object} avatarConfiguration
 * @param {Object} statusIndicatorConfiguration
 * @param {Object} badgeCountConfiguration
 * @param {Object} messageReceiptConfiguration
 * @param {Object} dateConfiguration
 */
class ConversationListItemConfiguration {
  constructor({
    conversationInputData = new ConversationInputData({}),
    style = new ConversationListItemStyle({}),
    showTypingIndicator = true,
    typingIndicatorText = "",
    hideThreadIndicator = false,
    hideGroupActions = false,
    hideDeletedMessages = false,
    threadIndicatorText = "",
    conversationOptions = [],
    avatarConfiguration = new AvatarConfiguration({}),
    statusIndicatorConfiguration = new StatusIndicatorConfiguration({}),
    badgeCountConfiguration = new BadgeCountConfiguration({}),
    messageReceiptConfiguration = new MessageReceiptConfiguration({}),
    dateConfiguration = new DateConfiguration({}),
  }) {
    this.conversationInputData = new ConversationInputData(
      conversationInputData ?? {}
    );
    this.style = new ConversationListItemStyle(style ?? {});
    this.showTypingIndicator = showTypingIndicator;
    this.typingIndicatorText = typingIndicatorText;
    this.hideThreadIndicator = hideThreadIndicator;
    this.hideGroupActions = hideGroupActions;
    this.hideDeletedMessages = hideDeletedMessages;
    this.threadIndicatorText = threadIndicatorText;
    this.conversationOptions = conversationOptions;
    this.avatarConfiguration = new AvatarConfiguration(
      avatarConfiguration ?? {}
    );
    this.statusIndicatorConfiguration = new StatusIndicatorConfiguration(
      statusIndicatorConfiguration ?? {}
    );
    this.badgeCountConfiguration = new BadgeCountConfiguration(
      badgeCountConfiguration ?? {}
    );
    this.messageReceiptConfiguration = new MessageReceiptConfiguration(
      messageReceiptConfiguration ?? {}
    );
    this.dateConfiguration = new DateConfiguration(dateConfiguration ?? {});
  }
}

export { ConversationListItemConfiguration };
