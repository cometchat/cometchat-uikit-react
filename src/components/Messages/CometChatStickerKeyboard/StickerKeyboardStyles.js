import { BaseStyles } from "../../Shared";
/**
 * @class StickerKeyboardStyles
 * @param {String} categoryBackground
 * @param {String} emptyTextFont
 * @param {String} emptyTextColor
 * @param {String} errorTextFont
 * @param {String} errorTextColor
 * @param {String} loadingTextColor
 * @param {String} loadingTextFont
 */

class StickerKeyboardStyles extends BaseStyles {
  constructor({
    categoryBackground = "",
    emptyTextFont = "",
    emptyTextColor = "",
    errorTextFont = "",
    errorTextColor = "",
    loadingTextColor = "",
    loadingTextFont = "",

    width = "100%",
    height = "auto",
    background = "",
    border = "none",
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

    this.categoryBackground = categoryBackground;
    this.emptyTextFont = emptyTextFont;
    this.emptyTextColor = emptyTextColor;
    this.errorTextFont = errorTextFont;
    this.errorTextColor = errorTextColor;
    this.loadingTextColor = loadingTextColor;
    this.loadingTextFont = loadingTextFont;
  }
}
export { StickerKeyboardStyles };
