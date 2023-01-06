import ImageURL from "./resources/1px.png";

import { ImageBubbleStyle } from "../../";

/**
 * @class ImageBubbleConfiguration
 * @description ImageBubbleConfiguration class is used for defining the ImageBubbleConfiguration templates.
 * @param {string} overlayImageURL
 * @param {object} style
 */

class ImageBubbleConfiguration {
  constructor({
    overlayImageURL = ImageURL,
    style = new ImageBubbleStyle({}),
  }) {
    this.style = new ImageBubbleStyle(style ?? {});
    this.overlayImageURL = overlayImageURL;
  }
}

export { ImageBubbleConfiguration };
