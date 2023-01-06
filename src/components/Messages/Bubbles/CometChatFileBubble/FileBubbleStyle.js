import { BaseStyles } from "../../../Shared";

/**
 * @class FileBubbleStyle
 * @description FileBubbleStyle is used to defining file bubble style
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} titleFont
 * @param {string} titleColor
 * @param {string} subTitleFont
 * @param {string} subTitleColor
 * @param {string} iconTint
 */

class FileBubbleStyle extends BaseStyles {
  constructor({
    width = "auto",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "8px",
    titleFont = "",
    titleColor = "",
    subTitleFont = "",
    subTitleColor = "",
    iconTint = "",
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
  }
}

export { FileBubbleStyle };
