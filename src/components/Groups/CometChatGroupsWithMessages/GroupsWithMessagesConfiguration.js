import { GroupsConfiguration, MessagesConfiguration } from "../../../";
import { GroupsWithMessagesStyle } from "../../Groups";
import { JoinProtectedGroupConfiguration } from "../CometChatJoinProtectedGroup/JoinProtectedGroupConfiguration";

/**
 * @class GroupsWithMessagesConfiguration
 * @param {object} style
 * @param {boolean} isMobileView
 * @param {object} groupsConfiguration
 * @param {object} MessagesConfiguration
 * @param {object} joinProtectedGroupConfiguration
 */
class GroupsWithMessagesConfiguration {
  constructor({
    style = new GroupsWithMessagesStyle({}),
    isMobileView = false,
    groupsConfiguration = new GroupsConfiguration({}),
    messagesConfiguration = new MessagesConfiguration({}),
    joinProtectedGroupConfiguration = new JoinProtectedGroupConfiguration({}),
  }) {
    this.style = new GroupsWithMessagesStyle(style ?? {});
    this.isMobileView = isMobileView;
    this.groupsConfiguration = new GroupsConfiguration(
      groupsConfiguration ?? {}
    );
    this.messagesConfiguration = new MessagesConfiguration(
      messagesConfiguration ?? {}
    );
    this.joinProtectedGroupConfiguration = new JoinProtectedGroupConfiguration(
      joinProtectedGroupConfiguration ?? {}
    );
  }
}

export { GroupsWithMessagesConfiguration };
