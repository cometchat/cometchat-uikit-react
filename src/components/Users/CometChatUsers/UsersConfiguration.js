import { UserListConfiguration } from "../CometChatUserList/UserListConfiguration";
import backIcon from "./resources/back.svg";
import searchIcon from "./resources/search.svg";
import { UsersStyle } from "./UsersStyle";

/**
 * @class UsersConfiguration
 * @description UsersConfiguration class is used for defining the template of Users
 * @param  {string} backButtonIconURL
 * @param  {string} searchIconURL
 * @param  {boolean} showBackButton
 * @param  {string} hideSearch
 * @param  {object} userListConfigurations
 * @param  {string} selectionMode
 * @param  {function} onSelection
 * @param  {object} style
 *
 */
export class UsersConfiguration {
  constructor({
    backButtonIconURL = backIcon,
    searchIconURL = searchIcon,
    showBackButton = false,
    hideSearch = false,
    selectionMode = "none",
    onSelection = () => {},
    style = new UsersStyle({}),
    userListConfiguration = new UserListConfiguration({}),
  }) {
    this.selectionMode = selectionMode;
    this.onSelection = onSelection;
    this.backButtonIconURL = backButtonIconURL;
    this.searchIconURL = searchIconURL;
    this.showBackButton = showBackButton;
    this.hideSearch = hideSearch;
    this.style = new UsersStyle(style || {});
    this.userListConfiguration = new UserListConfiguration(
      userListConfiguration || {}
    );
  }
}
