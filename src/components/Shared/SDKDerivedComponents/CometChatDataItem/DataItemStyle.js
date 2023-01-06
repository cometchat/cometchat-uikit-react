import { BaseStyles } from "../..";
/**
 * @class DataItemStyle
 * @param {String} titleFont
 * @param {String} titleColor
 * @param {String} outerView
 * @param {String} outerViewSpacing
 */

class DataItemStyle extends BaseStyles {
  constructor({
    titleColor = "",
    titleFont = "",
    subTitleColor = "",
    subTitleFont = "",

    width = "100%",
    height = "100%",
    background,
    activeBackground,
    border = "",
    borderRadius = "8px",
  }) {
    super({
      width,
      height,
      background,
      activeBackground,
      border,
      borderRadius,
    });

    this.titleColor = titleColor;
    this.titleFont = titleFont;
    this.subTitleColor = subTitleColor;
    this.subTitleFont = subTitleFont;
  }
}
export { DataItemStyle };
