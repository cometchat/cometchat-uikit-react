import { UsersConfiguration, MessagesConfiguration } from "../../";
import { UsersWithMessagesStyle } from "../../Users";

/**
 * @class UsersWithMessagesConfiguration
 * @param {Object} style
 * @param {Boolean} isMobileView
 * @param {Object} usersConfiguration
 * @param {Object} MessagesConfiguration
 */
class UsersWithMessagesConfiguration {
  constructor({
    style = new UsersWithMessagesStyle({}),
    isMobileView = false,
    usersConfiguration = new UsersConfiguration({}),
    messagesConfiguration = new MessagesConfiguration({}),
  }) {
    this.style = new UsersWithMessagesStyle(style ?? {});
    this.isMobileView = isMobileView;
    this.usersConfiguration = new UsersConfiguration(usersConfiguration ?? {});
    this.messagesConfiguration = new MessagesConfiguration(
      messagesConfiguration ?? {}
    );
  }
}

export { UsersWithMessagesConfiguration };
