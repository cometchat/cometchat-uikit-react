import { BaseStyles } from "../..";
/**
 * @class MenuListStyle
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} moreIconTint
 * @param {String} textFont
 * @param {String} textColor
 * @param {String} iconBackground
 * @param {String} iconTint
 * @param {String} iconBorder
 * @param {String} iconBorderRadius
 */

class MenuListStyle extends BaseStyles {
  constructor({
    width = "",
    height = "",
    background = "",
    activeBackground = "",
    border = "",
    borderRadius = "",
    textFont = "",
    textColor = "",
    iconTint = "",
    moreIconTint = "",
    iconBorder = "",
    iconBackground = "",
    iconBorderRadius = "",
  }) {
    super({
      width,
      height,
      background,
      activeBackground,
      border,
      borderRadius,
    });
    this.moreIconTint = moreIconTint;
    this.textFont = textFont;
    this.textColor = textColor;
    this.iconBackground = iconBackground;
    this.iconTint = iconTint;
    this.iconBorder = iconBorder;
    this.iconBorderRadius = iconBorderRadius;
  }
}
export { MenuListStyle };
