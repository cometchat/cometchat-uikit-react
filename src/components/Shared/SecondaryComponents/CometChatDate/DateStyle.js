import { BaseStyles } from "../..";
/**
 * @class DateStyle
 * @param {String} textFont
 * @param {String} textColor
 */

class DateStyle extends BaseStyles {
  constructor({
    textColor = "",
    textFont = "",

    width,
    height,
    background,
    activeBackground,
    border,
    borderRadius,
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
export { DateStyle };
