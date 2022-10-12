import { CreateGroupStyles } from "./CreateGroupStyles";
import closeIcon from "./resources/close.svg";

/**
 * @class CreateGroupConfiguration
 * @description CreateGroupConfiguration class is used for defining the CreateGroup template.
 *
 * @param {boolean} hideCloseButton
 * @param {string} closeButtonIconURL
 * @param {function} onClose
 * @param {function} onCreateGroup
 * @param {object} style
 */
export class CreateGroupConfiguration {
	constructor({
		hideCloseButton = false,
		closeButtonIconURL = closeIcon,
		onClose = null,
		onCreateGroup = null,
		style = new CreateGroupStyles({}),
	}) {
		this.hideCloseButton = hideCloseButton;
		this.closeButtonIconURL = closeButtonIconURL;
		this.onClose = onClose;
		this.onCreateGroup = onCreateGroup;
		this.style = new CreateGroupStyles(style || {});
	}
}
