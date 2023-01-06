import { BadgeCountStyle } from "../../../Shared";

/**
 * @class BadgeCountConfiguration
 * @param {Object} style
 * @param {Number} count
 */
class BadgeCountConfiguration {
  constructor({ style = new BadgeCountStyle({}), count = 0 }) {
    this.style = new BadgeCountStyle(style ?? {});
    this.count = count;
  }
}

export { BadgeCountConfiguration };
