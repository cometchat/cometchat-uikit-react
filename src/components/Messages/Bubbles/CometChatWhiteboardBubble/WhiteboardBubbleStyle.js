import { BaseStyles } from "../../../Shared";

/**
 * @class WhiteboardBubbleStyle
 * @description WhiteboardBubbleStyle is used to defining whiteboard bubble style
 * @param {string} width
 * @param {string} height
 * @param {string} titleFont
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} titleColor
 * @param {string} subTitleFont
 * @param {string} subTitleColor
 * @param {string} iconTint
 * @param {string} buttonBackground
 * @param {string} buttonTextColor
 * @param {string} buttonTextFont
 * @param {string} dividerTint
 */

class WhiteboardBubbleStyle extends BaseStyles {
  constructor({
    width = "228px",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "8px",
    titleFont = "",
    titleColor = "",
    subTitleFont = "",
    subTitleColor = "",
    iconTint = "",
    buttonBackground = "",
    buttonTextColor = "",
    buttonTextFont = "",
    dividerTint = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });
    this.titleFont = titleFont;
    this.titleColor = titleColor;
    this.subTitleFont = subTitleFont;
    this.subTitleColor = subTitleColor;
    this.iconTint = iconTint;
    this.buttonBackground = buttonBackground;
    this.buttonTextColor = buttonTextColor;
    this.buttonTextFont = buttonTextFont;
    this.dividerTint = dividerTint;
  }
}

export { WhiteboardBubbleStyle };
