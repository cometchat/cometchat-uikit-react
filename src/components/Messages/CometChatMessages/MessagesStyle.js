import { BaseStyles } from "../../Shared";
/**
 * @class MessagesStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} activeBackground
 */

class MessagesStyle extends BaseStyles {
  constructor({
    width = "100%",
    height = "100%",
    border = "none",
    borderRadius = "8px",
    background = "",
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
export { MessagesStyle };
