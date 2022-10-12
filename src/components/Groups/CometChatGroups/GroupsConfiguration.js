import { CreateGroupConfiguration } from "../CometChatCreateGroup/CreateGroupConfiguration";
import { GroupListConfiguration } from "../CometChatGroupList/GroupListConfiguration";
import { GroupsStyles } from "./GroupsStyles";
import createGroupIcon from "./resources/create.svg";
import backButton from "./resources/back.svg";
import search from "./resources/search.svg";

/**
 * @class GroupsConfiguration
 * @param {String} backButtonIconURL
 * @param {Boolean} showBackButton
 * @param {String} searchIconURL
 * @param {Boolean} hideSearch
 * @param {String} createGroupIconURL
 * @param {Boolean} hideCreateGroup
 * @param {Object} style
 * @param {Object} groupListConfiguration
 * @param {Object} createGroupConfiguration
 */
class GroupsConfiguration {
	constructor({
		backButtonIconURL = backButton,
		showBackButton = false,
		searchIconURL = search,
		hideSearch = false,
		createGroupIconURL = createGroupIcon,
		hideCreateGroup = false,
		style = new GroupsStyles({}),
		groupListConfiguration = new GroupListConfiguration({}),
		createGroupConfiguration = new CreateGroupConfiguration({}),
	}) {
		this.backButtonIconURL = backButtonIconURL;
		this.showBackButton = showBackButton;
		this.searchIconURL = searchIconURL;
		this.hideSearch = hideSearch;
		this.createGroupIconURL = createGroupIconURL;
		this.hideCreateGroup = hideCreateGroup;
		this.style = new GroupsStyles(style || {});
		groupListConfiguration =
			groupListConfiguration || new GroupListConfiguration({});
		createGroupConfiguration =
			createGroupConfiguration || new CreateGroupConfiguration({});
	}
}

export { GroupsConfiguration };
