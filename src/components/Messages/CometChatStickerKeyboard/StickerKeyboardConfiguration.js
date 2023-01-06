import { localize } from "../../../";
import { StickerKeyboardStyle } from "./StickerKeyboardStyle";

/**
 * @class StickerKeyboardConfiguration
 * @description StickerKeyboardConfiguration class is used for defining the StickerKeyboard templates.
 * @param {Function} onClick
 * @param {Object} style
 */

class StickerKeyboardConfiguration {
  constructor({ onClick = null, style = new StickerKeyboardStyle({}) }) {
    this.onClick = onClick;
    this.style = new StickerKeyboardStyle(style ?? {});
  }
}

export { StickerKeyboardConfiguration };
