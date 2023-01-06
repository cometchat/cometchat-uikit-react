import { BaseStyles } from "../../Shared";
/**
 * @class MessageHeaderStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} backButtonIconTin
 */

class MessageHeaderStyle extends BaseStyles {
  constructor({
    backButtonIconTint = "",
    width = "100%",
    height = "auto",
    border = "none",
    borderRadius = "none",
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

    this.backButtonIconTint = backButtonIconTint;
  }
}
export { MessageHeaderStyle };
