import { BaseStyles } from "../../Base/BaseStyles";

/**
 * @class ConversationListItemStyles
 * @description ConversationListItemStyles class is used for defining the styles for conversation list item.
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} activeBackground
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} titleColor
 * @param {String} titleFont
 * @param {String} subtitleColor
 * @param {String} subtitleFont
 * @param {String} typingIndicatorTextColor
 * @param {String} typingIndicatorTextFont
 * @param {String} threadIndicatorTextColor
 * @param {String} threadIndicatorTextFont
 */

class ConversationListItemStyles extends BaseStyles {
  constructor({
    width = "280px",
    height = "100%",
    background = "",
    activeBackground = "",
    border = "",
    borderRadius = "50%",

    titleColor = "",
    titleFont = "",
    subtitleColor = "",
    subtitleFont = "",
    typingIndicatorTextColor = "",
    typingIndicatorTextFont = "",
    threadIndicatorTextColor = "",
    threadIndicatorTextFont = "",
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
    this.subtitleColor = subtitleColor;
    this.subtitleFont = subtitleFont;
    this.typingIndicatorTextColor = typingIndicatorTextColor;
    this.typingIndicatorTextFont = typingIndicatorTextFont;
    this.threadIndicatorTextColor = threadIndicatorTextColor;
    this.threadIndicatorTextFont = threadIndicatorTextFont;
  }
}
export { ConversationListItemStyles };
