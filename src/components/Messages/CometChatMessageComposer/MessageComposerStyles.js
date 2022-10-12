import { BaseStyles } from "../../Shared";
/**
 * @class MessageComposerStyles
 * @param {String} inputBorderRadius
 * @param {String} inputBackground
 * @param {String} inputTextFont
 * @param {String} inputTextColor
 * @param {String} placeholderTextFont
 * @param {String} placeholderTextColor
 * @param {String} emojiIconTint
 * @param {String} attachmentIconTint
 * @param {String} stickerIconTint
 * @param {String} stickerCloseIconTint
 */

class MessageComposerStyles extends BaseStyles {
  constructor({
    inputBorderRadius = "",
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
    height = "100%",
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
export { MessageComposerStyles };
