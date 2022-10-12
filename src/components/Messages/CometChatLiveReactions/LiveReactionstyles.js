import { BaseStyles } from "../../Shared";
/**
 * @class LiveReactionStyles
 * @param {String} deleteIconTint
 * @param {String} boxShadow
 * @param {String} placeholderTextFont
 * @param {String} placeholderTextColor
 * @param {String} inputTextFont
 * @param {String} inputTextColor
 */

class LiveReactionStyles extends BaseStyles {
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
export { LiveReactionStyles };
