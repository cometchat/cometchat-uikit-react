import { BaseStyles } from "../../../Shared";

/**
 * @class StickerBubbleStyle
 * @description StickerBubbleStyle is used to defining sticker bubble styles.
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 */

class StickerBubbleStyle extends BaseStyles {
  constructor({
    width = "150px",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "12px",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });
  }
}

export { StickerBubbleStyle };
