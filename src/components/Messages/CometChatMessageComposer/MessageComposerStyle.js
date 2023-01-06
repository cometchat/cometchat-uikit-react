import { BaseStyles } from "../../Shared";
/**
 * @class MessageComposerStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} inputBorderRadius
 * @param {string} inputBackground
 * @param {string} inputTextFont
 * @param {string} inputTextColor
 * @param {string} placeholderTextFont
 * @param {string} placeholderTextColor
 * @param {string} emojiIconTint
 * @param {string} attachmentIconTint
 * @param {string} stickerIconTint
 * @param {string} stickerCloseIconTint
 */

class MessageComposerStyle extends BaseStyles {
  constructor({
    inputBorderRadius = "8px",
    inputBackground = "",
    inputTextFont = "",
    inputTextColor = "",
    placeholderTextFont = "",
    placeholderTextColor = "",
    emojiIconTint = "",
    attachmentIconTint = "",
    stickerIconTint = "",
    stickerCloseIconTint = "",
    sendButtonIconTint = "",

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

    this.inputBorderRadius = inputBorderRadius;
    this.inputBackground = inputBackground;
    this.inputTextFont = inputTextFont;
    this.inputTextColor = inputTextColor;
    this.placeholderTextFont = placeholderTextFont;
    this.placeholderTextColor = placeholderTextColor;
    this.emojiIconTint = emojiIconTint;
    this.attachmentIconTint = attachmentIconTint;
    this.stickerIconTint = stickerIconTint;
    this.stickerCloseIconTint = stickerCloseIconTint;
    this.sendButtonIconTint = sendButtonIconTint;
  }
}
export { MessageComposerStyle };
