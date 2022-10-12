import { StatusIndicatorStyles } from "../../../Shared";

/**
 * @class StatusIndicatorConfiguration
 * @param {Object} style
 * @param {String} backgroundImage
 */
class StatusIndicatorConfiguration {
	constructor({
		style = new StatusIndicatorStyles({}),
		backgroundImage = "",
	}) {
		this.style = new StatusIndicatorStyles(style ?? {});
		this.backgroundImage = backgroundImage;
	}
}

export { StatusIndicatorConfiguration };