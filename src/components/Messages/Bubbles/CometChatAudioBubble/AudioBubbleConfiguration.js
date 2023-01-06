import { AudioBubbleStyle } from "../../";

/**
 * @class AudioBubbleConfiguration
 * @description AudioBubbleConfiguration class is used for defining the AudioBubbleConfiguration templates.
 * @param {object} style
 */

class AudioBubbleConfiguration {
  constructor({ style = new AudioBubbleStyle({}) }) {
    this.style = new AudioBubbleStyle(style ?? {});
  }
}

export { AudioBubbleConfiguration };
