import { CreateGroupConfiguration } from "../CometChatCreateGroup/CreateGroupConfiguration";
import { GroupListConfiguration } from "../CometChatGroupList/GroupListConfiguration";
import { GroupsStyle } from "./GroupsStyle";
import createGroupIcon from "./resources/create.svg";
import backButton from "./resources/back.svg";
import search from "./resources/search.svg";

/**
 * @class GroupsConfiguration
 * @param {string} backButtonIconURL
 * @param {boolean} showBackButton
 * @param {string} searchIconURL
 * @param {boolean} hideSearch
 * @param {string} createGroupIconURL
 * @param {boolean} hideCreateGroup
 * @param {object} style
 * @param {object} groupListConfiguration
 * @param {object} createGroupConfiguration
 */
class GroupsConfiguration {
  constructor({
    backButtonIconURL = backButton,
    showBackButton = false,
    searchIconURL = search,
    hideSearch = false,
    createGroupIconURL = createGroupIcon,
    hideCreateGroup = false,
    style = new GroupsStyle({}),
    groupListConfiguration = new GroupListConfiguration({}),
    createGroupConfiguration = new CreateGroupConfiguration({}),
  }) {
    this.backButtonIconURL = backButtonIconURL;
    this.showBackButton = showBackButton;
    this.searchIconURL = searchIconURL;
    this.hideSearch = hideSearch;
    this.createGroupIconURL = createGroupIconURL;
    this.hideCreateGroup = hideCreateGroup;
    this.style = new GroupsStyle(style || {});
    this.groupListConfiguration =
      groupListConfiguration || new GroupListConfiguration({});
    this.createGroupConfiguration =
      createGroupConfiguration || new CreateGroupConfiguration({});
  }
}

export { GroupsConfiguration };
