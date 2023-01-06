import { JoinProtectedGroupStyle } from "./JoinProtectedGroupsStyle";

/**
 * @class JoinProtectedGroupConfiguration
 * @description JoinProtectedGroupConfiguration class is used for defining the JoinProtectedGroup template.
 * @param {object} style
 */
export class JoinProtectedGroupConfiguration {
  constructor({ style = new JoinProtectedGroupStyle({}) }) {
    this.style = new JoinProtectedGroupStyle(style || {});
  }
}
