import { BaseStyles } from "../..";
/**
 * @class ConfirmDialogStyle
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} subTitleColor
 * @param {String} subTitleFont
 * @param {String} cancelButtonBackground
 * @param {String} confirmButtonTextFont
 * @param {String} confirmButtonTextColor
 * @param {String} cancelButtonTextColor
 * @param {String} cancelButtonTextFont
 * @param {String} confirmButtonBackground
 * @param {String} titleFont
 * @param {String} titleColor
 */

class ConfirmDialogStyle extends BaseStyles {
  constructor({
    width = "360px",
    height = "292px",
    background = "",
    border = "",
    borderRadius = "12px",
    activeBackground = "",
    subTitleColor = "",
    subTitleFont = "",
    cancelButtonBackground = "",
    confirmButtonTextFont = "",
    confirmButtonTextColor = "",
    cancelButtonTextColor = "",
    cancelButtonTextFont = "",
    confirmButtonBackground = "",
    titleFont = "",
    titleColor = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
      activeBackground,
    });
    this.titleFont = titleFont;
    this.titleColor = titleColor;
    this.subTitleFont = subTitleFont;
    this.subTitleColor = subTitleColor;
    this.cancelButtonTextFont = cancelButtonTextFont;
    this.confirmButtonTextFont = confirmButtonTextFont;
    this.cancelButtonTextColor = cancelButtonTextColor;
    this.confirmButtonTextColor = confirmButtonTextColor;
    this.cancelButtonBackground = cancelButtonBackground;
    this.confirmButtonBackground = confirmButtonBackground;
  }
}
export { ConfirmDialogStyle };
