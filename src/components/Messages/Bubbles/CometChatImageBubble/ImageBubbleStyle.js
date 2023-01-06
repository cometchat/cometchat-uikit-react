import { BaseStyles } from "../../../Shared";

/**
 * @class ImageBubbleStyle
 * @description ImageBubbleStyle is used to defining image bubble styles.
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} activityBackground
 */

class ImageBubbleStyle extends BaseStyles {
  constructor({
    width = "100%",
    height = "168px",
    background = "",
    border = "",
    borderRadius = "12px",
    activityBackground = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });

    this.activityBackground = activityBackground;
  }
}

export { ImageBubbleStyle };
