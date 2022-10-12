import reloadIcon from "./resources/spinner.svg";
import { UserListStyles } from "./UserListStyles";
import { DataItemConfiguration, CustomView } from "../../Shared";
/**
 * @class UserListConfiguration
 * @description UserListConfiguration class is used for defining the template of UserList
 * @param  {number} limit
 * @param  {string} searchKeyword
 * @param  {string} status
 * @param  {array} roles
 * @param  {boolean} friendsOnly
 * @param  {boolean} hideBlockedUsers
 * @param  {array} tags
 * @param  {array} uids
 * @param  {object} customView
 * @param  {string} loadingIconURL
 * @param  {boolean} hideError
 * @param  {object} style
 * @param  {object} dataItemConfiguration
 *
 */
export class UserListConfiguration {
	constructor({
		limit = 30,
		searchKeyword = "",
		status = "",
		roles = null,
		friendsOnly = false,
		hideBlockedUsers = false,
		tags = null,
		uids = null,
		customView = new CustomView({
			loading: "",
			empty: "",
			error: "",
		}),
		loadingIconURL = reloadIcon,
		hideError = false,
		style = new UserListStyles({}),
		dataItemConfiguration = new DataItemConfiguration({}),
	}) {
		this.limit = limit;
		this.searchKeyword = searchKeyword;
		this.status = status;
		this.roles = roles;
		this.friendsOnly = friendsOnly;
		this.hideBlockedUsers = hideBlockedUsers;
		this.tags = tags;
		this.uids = uids;
		this.customView = customView;
		this.loadingIconURL = loadingIconURL;
		this.hideError = hideError;
		this.style = new UserListStyles(style || {});
		this.dataItemConfiguration = new DataItemConfiguration(
			dataItemConfiguration || {}
		);
	}
}
