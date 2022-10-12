import { EmojiKeyboardStyles } from "../";

/**
 * @class EmojiKeyboardConfiguration
 * @description EmojiKeyboardConfiguration class is used for defining the EmojiKeyboard templates.
 * @param {Boolean} hideSearch
 * @param {Function} onClick
 * @param {Object} style
 */

class EmojiKeyboardConfiguration {
  constructor({
    hideSearch = true,
    onClick = null,
    style = new EmojiKeyboardStyles({}),
  }) {
    this.hideSearch = hideSearch;
    this.onClick = onClick;
    this.style = style;
  }
}

export { EmojiKeyboardConfiguration };
