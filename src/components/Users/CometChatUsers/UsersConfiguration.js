import { UserListConfiguration } from "../CometChatUserList/UserListConfiguration";
import backIcon from "./resources/back.svg";
import searchIcon from "./resources/search.svg";
import { UsersStyles } from "./UsersStyles";

/**
 * @class UsersConfiguration
 * @description UsersConfiguration class is used for defining the template of Users
 * @param  {string} backButtonIconURL
 * @param  {string} searchIconURL
 * @param  {boolean} showBackButton
 * @param  {string} hideSearch
 * @param  {object} userListConfigurations
 *
 */
export class UsersConfiguration {
	constructor({
		backButtonIconURL = backIcon,
		searchIconURL = searchIcon,
		showBackButton = false,
		hideSearch = false,
		style = new UsersStyles({}),
		userListConfiguration = new UserListConfiguration({}),
	}) {
		this.backButtonIconURL = backButtonIconURL;
		this.searchIconURL = searchIconURL;
		this.showBackButton = showBackButton;
		this.hideSearch = hideSearch;
		this.style = new UsersStyles(style || {});
		this.userListConfiguration = new UserListConfiguration(
			userListConfiguration || {}
		);
	}
}
