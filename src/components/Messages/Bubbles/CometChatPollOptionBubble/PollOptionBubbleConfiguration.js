import { PollOptionBubbleStyle } from "../../";

/**
 * @class PollOptionBubbleConfiguration
 * @description PollOptionBubbleConfiguration class is used for defining the PollOptionBubbleConfiguration templates.
 * @param {object} style
 */

class PollOptionBubbleConfiguration {
  constructor({ style = new PollOptionBubbleStyle({}) }) {
    this.style = new PollOptionBubbleStyle(style ?? {});
  }
}

export { PollOptionBubbleConfiguration };
