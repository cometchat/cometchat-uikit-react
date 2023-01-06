import { BaseStyles } from "../../../Shared";

/**
 * @class MessageBubbleStyle
 * @description MessageBubbleStyle is used to defining message bubble style
 * @param {string} width
 * @param {string} height
 * @param {string} nameTextFont
 * @param {string} nameTextColor
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} timestampFont
 * @param {string} timestampColor
 */

class MessageBubbleStyle extends BaseStyles {
  constructor({
    width = "100%",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "12px",
    activeBackground = "",
    nameTextFont = "",
    nameTextColor = "",
    timestampFont = "",
    timestampColor = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
      activeBackground,
    });
    this.nameTextFont = nameTextFont;
    this.nameTextColor = nameTextColor;
    this.timestampFont = timestampFont;
    this.timestampColor = timestampColor;
  }
}

export { MessageBubbleStyle };
