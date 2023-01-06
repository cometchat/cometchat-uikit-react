import { BaseStyles } from "../..";
/**
 * @class ListItemStyle
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} textFont
 * @param {String} textColor
 * @param {String} outerView
 * @param {String} outerViewSpacing
 */

class ListItemStyle extends BaseStyles {
  constructor({
    textColor = "",
    textFont = "",
    outerView = "",
    outerViewSpacing = "",

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
    this.outerView = outerView;
    this.outerViewSpacing = outerViewSpacing;
  }
}
export { ListItemStyle };
