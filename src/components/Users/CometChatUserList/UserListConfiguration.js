import reloadIcon from "./resources/spinner.svg";
import { UserListStyle } from "./UserListStyle";
import { DataItemConfiguration, CustomView } from "../../Shared";
/**
 * @class UserListConfiguration
 * @description UserListConfiguration class is used for defining the template of UserList
 * @param  {number} limit
 * @param  {string} searchKeyword
 * @param  {string} status
 * @param  {array}  roles
 * @param  {boolean} friendsOnly
 * @param  {boolean} hideBlockedUsers
 * @param  {array} tags
 * @param  {array} uids
 * @param  {object} customView
 * @param  {string} loadingIconURL
 * @param  {boolean} hideError
 * @param  {object} style
 * @param  {object} dataItemConfiguration
 * @param {string} selectionMode
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
    selectionMode = "none",
    style = new UserListStyle({}),
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
    this.selectionMode = selectionMode;
    this.style = new UserListStyle(style || {});
    this.dataItemConfiguration = new DataItemConfiguration(
      dataItemConfiguration || {}
    );
  }
}
