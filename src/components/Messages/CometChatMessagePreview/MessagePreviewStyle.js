import { BaseStyles } from "../../Shared";
/**
 * @class MessagePreviewStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} messagePreviewTitleFont
 * @param {string} messagePreviewTitleColor
 * @param {string} messagePreviewSubtitleColor
 * @param {string} messagePreviewSubtitleFont
 * @param {string} closeIconTint
 */

class MessagePreviewStyle extends BaseStyles {
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
export { MessagePreviewStyle };
