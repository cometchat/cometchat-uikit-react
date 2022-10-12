import { AvatarStyles } from "../../../Shared";

/**
 * @class AvatarConfiguration
 * @param {Object} style
 * @param {String} image
 * @param {String} name
 */
class AvatarConfiguration {
	constructor({
		style = new AvatarStyles({}),
		image = "",
		name = "",
	}) {
		this.style = new AvatarStyles(style ?? {});
		this.image = image;
		this.name = name;
	}
}

export { AvatarConfiguration };