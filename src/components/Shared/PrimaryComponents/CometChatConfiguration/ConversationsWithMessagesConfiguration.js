import { ConversationsConfiguration } from "../";
import { MessagesConfiguration } from "../../../../";
import { ConversationsWithMessagesStyles } from "../../../Chats";

/**
 * @class ConversationsWithMessagesConfiguration
 * @param {Object} style
 * @param {Boolean} isMobileView
 * @param {Object} conversationsConfiguration
 * @param {Object} MessagesConfiguration
 */
class ConversationsWithMessagesConfiguration {
  constructor({
    style = new ConversationsWithMessagesStyles({}),
    isMobileView = false,
    conversationsConfiguration = new ConversationsConfiguration({}),
    messagesConfiguration = new MessagesConfiguration({}),
  }) {
    this.style = new ConversationsWithMessagesStyles(style ?? {});
    this.isMobileView = isMobileView;
    this.conversationsConfiguration = new ConversationsConfiguration(
      conversationsConfiguration ?? {}
    );
    this.messagesConfiguration = new MessagesConfiguration(
      messagesConfiguration ?? {}
    );
  }
}

export { ConversationsWithMessagesConfiguration };
