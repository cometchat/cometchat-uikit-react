import { VideoBubbleStyle } from "../../";

/**
 * @class VideoBubbleConfiguration
 * @description VideoBubbleConfiguration class is used for defining the VideoBubbleConfiguration templates.
 * @param {object} style
 */

class VideoBubbleConfiguration {
  constructor({ style = new VideoBubbleStyle({}) }) {
    this.style = new VideoBubbleStyle(style ?? {});
  }
}

export { VideoBubbleConfiguration };
