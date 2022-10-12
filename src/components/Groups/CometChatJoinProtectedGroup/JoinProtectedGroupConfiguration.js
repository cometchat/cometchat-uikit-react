import { JoinProtectedGroupStyles } from "./JoinProtectedGroupsStyles";

/**
 * @class JoinProtectedGroupConfiguration
 * @description JoinProtectedGroupConfiguration class is used for defining the JoinProtectedGroup template.
 * @param {object} style
 */
export class JoinProtectedGroupConfiguration {
	constructor({ style = new JoinProtectedGroupStyles({}) }) {
		this.style = new JoinProtectedGroupStyles(style || {});
	}
}
