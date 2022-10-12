import { GroupsConfiguration, MessagesConfiguration } from "../../../";
import { GroupsWithMessagesStyles } from "../../Groups";
import { JoinProtectedGroupConfiguration } from "../CometChatJoinProtectedGroup/JoinProtectedGroupConfiguration";

/**
 * @class GroupsWithMessagesConfiguration
 * @param {Object} style
 * @param {Boolean} isMobileView
 * @param {Object} groupsConfiguration
 * @param {Object} MessagesConfiguration
 * @param {Object} joinProtectedGroupConfiguration
 */
class GroupsWithMessagesConfiguration {
	constructor({
		style = new GroupsWithMessagesStyles({}),
		isMobileView = false,
		groupsConfiguration = new GroupsConfiguration({}),
		messagesConfiguration = new MessagesConfiguration({}),
		joinProtectedGroupConfiguration = new JoinProtectedGroupConfiguration({}),
	}) {
		this.style = new GroupsWithMessagesStyles(style ?? {});
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
