import { BaseStyles } from "../../Shared";
/**
 * @class EmojiKeyboardStyle
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 * @param {string} sectionHeaderFont
 * @param {string} sectionHeaderColor
 * @param {string} categoryIconTint
 * @param {string} selectedCategoryIconTint
 */

class EmojiKeyboardStyle extends BaseStyles {
  constructor({
    sectionHeaderFont = "",
    sectionHeaderColor = "",
    categoryIconTint = "",
    selectedCategoryIconTint = "",

    width = "275px",
    height = "330px",
    background = "",
    border = "none",
    borderRadius = "8px",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });

    this.sectionHeaderFont = sectionHeaderFont;
    this.sectionHeaderColor = sectionHeaderColor;
    this.categoryIconTint = categoryIconTint;
    this.selectedCategoryIconTint = selectedCategoryIconTint;
  }
}
export { EmojiKeyboardStyle };
