import { BaseStyles } from "../../Shared";
/**
 * @class StickerKeyboardStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} categoryBackground
 * @param {string} emptyTextFont
 * @param {string} emptyTextColor
 * @param {string} errorTextFont
 * @param {string} errorTextColor
 * @param {string} loadingTextColor
 * @param {string} loadingTextFont
 */

class StickerKeyboardStyle extends BaseStyles {
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
export { StickerKeyboardStyle };
