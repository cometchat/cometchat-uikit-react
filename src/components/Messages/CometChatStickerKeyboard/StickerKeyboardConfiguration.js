import { localize } from "../../../";
import { StickerKeyboardStyles } from "./StickerKeyboardStyles";

/**
 * @class StickerKeyboardConfiguration
 * @description StickerKeyboardConfiguration class is used for defining the StickerKeyboard templates.
 * @param {Function} onClick
 * @param {Object} style
 */

class StickerKeyboardConfiguration {
  constructor({ onClick = null, style = new StickerKeyboardStyles({}) }) {
    this.onClick = onClick;
    this.style = new StickerKeyboardStyles(style ?? {});
  }
}

export { StickerKeyboardConfiguration };
