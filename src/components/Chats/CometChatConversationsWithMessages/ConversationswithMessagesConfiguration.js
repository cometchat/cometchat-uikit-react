import { ConversationsConfiguration } from "../../..";
import { MessagesConfiguration } from "../../../";
import { ConversationsWithMessagesStyle } from "../";

/**
 * @class ConversationsWithMessagesConfiguration
 * @param {Object} style
 * @param {Boolean} isMobileView
 * @param {Object} conversationsConfiguration
 * @param {Object} MessagesConfiguration
 */
class ConversationsWithMessagesConfiguration {
  constructor({
    style = new ConversationsWithMessagesStyle({}),
    isMobileView = false,
    conversationsConfiguration = new ConversationsConfiguration({}),
    messagesConfiguration = new MessagesConfiguration({}),
  }) {
    this.style = new ConversationsWithMessagesStyle(style ?? {});
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
