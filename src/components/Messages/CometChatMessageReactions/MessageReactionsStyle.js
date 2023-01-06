import { BaseStyles } from "../../Shared";
/**
 * @class MessageReactionsStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} textColor
 * @param {string} textFont
 * @param {string} addReactionIconTint
 * @param {string} addReactionIconBackground
 */

class MessageReactionsStyle extends BaseStyles {
  constructor({
    textColor = "",
    textFont = "",
    addReactionIconTint = "",
    addReactionIconBackground = "",

    width = "100%",
    height = "auto",
    border = "none",
    borderRadius = "12px",
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

    this.textFont = textFont;
    this.textColor = textColor;
    this.addReactionIconTint = addReactionIconTint;
    this.addReactionIconBackground = addReactionIconBackground;
  }
}
export { MessageReactionsStyle };
