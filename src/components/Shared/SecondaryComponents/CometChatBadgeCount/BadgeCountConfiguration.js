import { BadgeCountStyles } from "../../../Shared";

/**
 * @class BadgeCountConfiguration
 * @param {Object} style
 * @param {Number} count
 */
class BadgeCountConfiguration {
	constructor({
		style = new BadgeCountStyles({}),
		count = 0,
	}) {
		this.style = new BadgeCountStyles(style ?? {});
		this.count = count;
	}
}

export { BadgeCountConfiguration };