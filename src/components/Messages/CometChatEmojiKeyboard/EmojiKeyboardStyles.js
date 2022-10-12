import { BaseStyles } from "../../Shared";
/**
 * @class EmojiKeyboardStyles
 * @param {String} sectionHeaderFont
 * @param {String} sectionHeaderColor
 * @param {String} categoryIconTint
 * @param {String} selectedCategoryIconTint
 */

class EmojiKeyboardStyles extends BaseStyles {
  constructor({
    sectionHeaderFont = "",
    sectionHeaderColor = "",
    categoryIconTint = "",
    selectedCategoryIconTint = "",
    categoryBackground = "",

    width = "272px",
    height = "330px",
    background = "",
    border = "none",
    borderRadius = "8px",
    activeBackground = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
      activeBackground,
    });

    this.sectionHeaderFont = sectionHeaderFont;
    this.sectionHeaderColor = sectionHeaderColor;
    this.categoryIconTint = categoryIconTint;
    this.selectedCategoryIconTint = selectedCategoryIconTint;
    this.categoryBackground = categoryBackground;
  }
}
export { EmojiKeyboardStyles };
