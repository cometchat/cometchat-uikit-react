import { BaseStyles } from "../../Shared";
/**
 * @class CreatePollOptionStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} deleteIconTint
 * @param {string} boxShadow
 * @param {string} placeholderTextFont
 * @param {string} placeholderTextColor
 * @param {string} inputTextFont
 * @param {string} inputTextColor
 */

class CreatePollOptionStyle extends BaseStyles {
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
  }) {
    super({
      width,
      height,
      background,
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
export { CreatePollOptionStyle };
