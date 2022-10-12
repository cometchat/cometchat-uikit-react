import { DateStyles } from "../../../Shared";

/**
 * @class DateConfiguration
 * @param {Object} style
 * @param {String} pattern
 * @param {String} customPattern
 */
class DateConfiguration {
	constructor({
		style = new DateStyles({}),
		pattern = "",
		customPattern = null
	}) {
		this.style = new DateStyles(style ?? {});
		this.pattern = pattern;
		this.customPattern = customPattern;
	}
}

export { DateConfiguration };