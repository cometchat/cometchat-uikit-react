import { BaseStyles } from "../../Shared";
/**
 * @class SmartReplyStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} textBackground
 * @param {string} textColor
 * @param {string} textFont
 * @param {string} closeIconTint
 * @param {string} closeIconBackground
 */

class SmartReplyStyle extends BaseStyles {
  constructor({
    textFont = "",
    textColor = "",
    textBackground = "",
    closeIconTint = "",
    closeIconBackground = "",
    boxShadow = "",

    width = "auto",
    height = "auto",
    border = "none",
    borderRadius = "none",
    background = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });

    this.textBackground = textBackground;
    this.textColor = textColor;
    this.textFont = textFont;
    this.closeIconTint = closeIconTint;
    this.closeIconBackground = closeIconBackground;
    this.boxShadow = boxShadow;
  }
}
export { SmartReplyStyle };
