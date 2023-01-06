import { BaseStyles } from "../../Shared";
/**
 * @class LiveReactionsStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} deleteIconTint
 * @param {string} boxShadow
 * @param {string} placeholderTextFont
 * @param {string} placeholderTextColor
 * @param {string} inputTextFont
 * @param {string} inputTextColor
 */

class LiveReactionsStyle extends BaseStyles {
  constructor({
    width = "20px",
    height = "20px",
    background = "transparent",
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
  }
}
export { LiveReactionsStyle };
