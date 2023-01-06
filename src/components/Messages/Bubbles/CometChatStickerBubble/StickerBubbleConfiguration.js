import { StickerBubbleStyle } from "../../";

/**
 * @class StickerBubbleConfiguration
 * @description StickerBubbleConfiguration class is used for defining the StickerBubbleConfiguration templates.
 * @param {object} style
 */

class StickerBubbleConfiguration {
  constructor({ style = new StickerBubbleStyle({}) }) {
    this.style = new StickerBubbleStyle(style ?? {});
  }
}

export { StickerBubbleConfiguration };
