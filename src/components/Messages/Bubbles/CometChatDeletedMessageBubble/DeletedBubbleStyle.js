import { BaseStyles } from "../../../Shared";

/**
 * @class DeletedBubbleStyle
 * @description DeletedBubbleStyle is used to defining delete bubble style
 * @param {String} width
 * @param {String} height
 * @param {String} textFont
 * @param {String} textColor
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 */

class DeletedBubbleStyle extends BaseStyles {
  constructor({
    width = "auto",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "12px",
    textFont = "",
    textColor = "",
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
  }
}

export { DeletedBubbleStyle };
