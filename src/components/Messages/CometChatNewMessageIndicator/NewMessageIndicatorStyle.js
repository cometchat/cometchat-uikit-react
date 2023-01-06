import { BaseStyles } from "../../Shared";
/**
 * @class NewMessageIndicatorStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} textFont
 * @param {string} textColor
 * @param {string} iconTint
 */

class NewMessageIndicatorStyle extends BaseStyles {
  constructor({
    iconTint = "",
    textColor = "",
    textFont = "",

    width = "auto",
    height = "auto",
    border = "none",
    borderRadius = "6px",
    background = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });

    this.textFont = textFont;
    this.textColor = textColor;
    this.iconTint = iconTint;
  }
}
export { NewMessageIndicatorStyle };
