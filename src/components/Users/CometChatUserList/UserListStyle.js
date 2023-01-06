import { BaseStyles } from "../../Shared";
/**
 * @class UserListStyle
 * @description Styling component for UserListStyle
 * @param  {string} height
 * @param  {string} width
 * @param  {string} border
 * @param  {string} borderRadius
 * @param  {string} backgroundColor
 * @param  {string} loadingIconTint
 * @param  {string} emptyTextFont
 * @param  {string} emptyTextColor
 * @param  {string} errorTextFont
 * @param  {string} errorTextColor
 * @param  {string} sectionHeaderTextFont
 * @param  {string} sectionHeaderTextColor
 */

export class UserListStyle extends BaseStyles {
  constructor({
    width = "100%",
    height = "100%",
    backgroundColor = "transparent",
    border = "0px solid transparent",
    borderRadius = "0px",
    loadingIconTint = "",
    emptyTextFont = "",
    emptyTextColor = "",
    errorTextFont = "",
    errorTextColor = "",
    sectionHeaderTextFont = "",
    sectionHeaderTextColor = "",
  }) {
    super({
      height,
      width,
      border,
      borderRadius,
      backgroundColor,
    });
    this.loadingIconTint = loadingIconTint;
    this.emptyTextFont = emptyTextFont;
    this.emptyTextColor = emptyTextColor;
    this.errorTextFont = errorTextFont;
    this.errorTextColor = errorTextColor;
    this.sectionHeaderTextFont = sectionHeaderTextFont;
    this.sectionHeaderTextColor = sectionHeaderTextColor;
  }
}
