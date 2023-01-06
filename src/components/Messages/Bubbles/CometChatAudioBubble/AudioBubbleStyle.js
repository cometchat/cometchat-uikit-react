import { BaseStyles } from "../../../Shared";

/**
 * @class AudioBubbleStyle
 * @description AudioBubbleStyle is used to defining audio bubble style
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} iconTint
 */

class AudioBubbleStyle extends BaseStyles {
  constructor({
    width = "228px",
    height = "auto",
    background = "",
    border = "",
    borderRadius = "12px",

    iconTint = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });

    this.iconTint = iconTint;
  }
}

export { AudioBubbleStyle };
