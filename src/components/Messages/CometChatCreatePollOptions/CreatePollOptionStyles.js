import { BaseStyles } from "../../Shared";
/**
 * @class CreatePollOptionStyles
 * @param {String} deleteIconTint
 * @param {String} boxShadow
 * @param {String} placeholderTextFont
 * @param {String} placeholderTextColor
 * @param {String} inputTextFont
 * @param {String} inputTextColor
 */

class CreatePollOptionStyles extends BaseStyles {
  constructor({
    deleteIconTint = "",
    boxShadow = "",
    placeholderTextFont = "",
    placeholderTextColor = "",
    inputTextFont = "",
    inputTextColor = "",

    width = "100%",
    height = "46px",
    background = "",
    border = "",
    borderRadius = "8px",
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

    this.deleteIconTint = deleteIconTint;
    this.boxShadow = boxShadow;
    this.placeholderTextFont = placeholderTextFont;
    this.placeholderTextColor = placeholderTextColor;
    this.inputTextFont = inputTextFont;
    this.inputTextColor = inputTextColor;
  }
}
export { CreatePollOptionStyles };
