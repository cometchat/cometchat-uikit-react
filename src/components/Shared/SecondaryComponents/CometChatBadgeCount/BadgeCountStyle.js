import { BaseStyles } from "../..";
/**
 * @class BadgeCountStyle
 * @param {String} textFont
 * @param {String} textColor
 */

class BadgeCountStyle extends BaseStyles {
  constructor({
    textFont = "",
    textColor = "",

    width = "fit-content",
    height = "20px",
    background = "",
    activeBackground,
    border = "",
    borderRadius = "11px",
  }) {
    super({
      width,
      height,
      background,
      activeBackground,
      border,
      borderRadius,
    });
    this.textColor = textColor;
    this.textFont = textFont;
  }
}
export { BadgeCountStyle };
