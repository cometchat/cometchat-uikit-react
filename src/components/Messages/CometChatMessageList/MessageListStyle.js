import { BaseStyles } from "../../Shared";
/**
 * @class MessageListStyle
 * @description MessageListStyle class is used for defining the messageList component's style
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} loadingIconTint
 * @param {String} TextFont
 * @param {String} TextColor
 * @param {String} emptyTextFont
 * @param {String} emptyTextColor
 * @param {String} errorTextFont
 * @param {String} errorTextColor
 */

class MessageListStyle extends BaseStyles {
  constructor({
    width = "100%",
    height = "100%",
    background = "",
    border = "",
    borderRadius = "8px",
    activeBackground = "",
    loadingIconTint = "",

    emptyTextFont = "",
    emptyTextColor = "",
    errorTextFont = "",
    errorTextColor = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
      activeBackground,
    });
    this.loadingIconTint = loadingIconTint;

    this.emptyTextFont = emptyTextFont;
    this.emptyTextColor = emptyTextColor;
    this.errorTextFont = errorTextFont;
    this.errorTextColor = errorTextColor;
  }
}
export { MessageListStyle };
