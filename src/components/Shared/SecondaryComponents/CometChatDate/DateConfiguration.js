import { DateStyle } from "../../../Shared";

/**
 * @class DateConfiguration
 * @param {Object} style
 * @param {String} pattern
 * @param {String} customPattern
 */
class DateConfiguration {
  constructor({
    style = new DateStyle({}),
    pattern = "",
    customPattern = null,
  }) {
    this.style = new DateStyle(style ?? {});
    this.pattern = pattern;
    this.customPattern = customPattern;
  }
}

export { DateConfiguration };
