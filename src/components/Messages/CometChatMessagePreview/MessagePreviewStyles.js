import { BaseStyles } from "../../Shared";
/**
 * @class MessagePreviewStyles
 * @param {String} border
 * @param {String} background
 * @param {String} messagePreviewTitleFont
 * @param {String} messagePreviewTitleColor
 * @param {String} messagePreviewSubtitleColor
 * @param {String} messagePreviewSubtitleFont
 * @param {String} closeIconTint
 */

class MessagePreviewStyles extends BaseStyles {
  constructor({
    messagePreviewTitleFont = "",
    messagePreviewTitleColor = "",
    messagePreviewSubtitleColor = "",
    messagePreviewSubtitleFont = "",
    closeIconTint = "",

    width = "100%",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "",
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

    this.messagePreviewTitleFont = messagePreviewTitleFont;
    this.messagePreviewTitleColor = messagePreviewTitleColor;
    this.messagePreviewSubtitleColor = messagePreviewSubtitleColor;
    this.messagePreviewSubtitleFont = messagePreviewSubtitleFont;
    this.closeIconTint = closeIconTint;
  }
}
export { MessagePreviewStyles };
