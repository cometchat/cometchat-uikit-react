import { BaseStyles } from "../..";
/**
 * @class DecoratorMessageStyle
 * @param {String} textFont
 * @param {String} textColor
 */

class DecoratorMessageStyle extends BaseStyles {
  constructor({
    textColor = "",
    textFont = "",

    width = "auto",
    height = "auto",
    background = "",
    border = "none",
    borderRadius = "none",
    activeBackground = "",
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
export { DecoratorMessageStyle };
