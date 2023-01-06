import { BaseStyles } from "../../../Shared";

/**
 * @class VideoBubbleStyle
 * @description VideoBubbleStyle is used to defining video bubble styles.
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} background
 */

class VideoBubbleStyle extends BaseStyles {
  constructor({
    width = "250px",
    height = "200px",
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

export { VideoBubbleStyle };
