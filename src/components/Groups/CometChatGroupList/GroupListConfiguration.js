import { DataItemConfiguration } from "../../Shared";
import loadingIcon from "./resources/spinner.svg";
import { GroupListStyle } from "./GroupListStyle";
import { CustomView } from "../../Shared";

/**
 * @class GroupListConfiguration
 * @description GroupListConfiguration class is used for defining the GroupList template.
 * @param {number} limit
 * @param {string} searchKeyword
 * @param {boolean} joinedOnly
 * @param {array} tags
 * @param {object} style
 * @param {object} customView
 * @param {boolean} hideError
 * @param {string} loadingIconURL
 * @param {object} dataItemConfiguration
 */
export class GroupListConfiguration {
  constructor({
    limit = 30,
    searchKeyword = "",
    joinedOnly = false,
    tags = null,
    loadingIconURL = loadingIcon,
    style = new GroupListStyle({}),
    customView = new CustomView({
      loading: "",
      empty: "",
      error: "",
    }),
    hideError = false,
    dataItemConfiguration = new DataItemConfiguration({}),
  }) {
    this.limit = limit;
    this.searchKeyword = searchKeyword;
    this.joinedOnly = joinedOnly;
    this.tags = tags;
    this.loadingIconURL = loadingIconURL;
    this.style = new GroupListStyle(style || {});
    this.customView = new GroupListStyle(customView || {});
    this.hideError = hideError;
    this.dataItemConfiguration = new DataItemConfiguration(
      dataItemConfiguration || {}
    );
  }
}
