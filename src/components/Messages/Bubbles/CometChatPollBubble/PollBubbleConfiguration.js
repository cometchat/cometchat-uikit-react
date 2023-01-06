import ImageURL from "./resources/checkmark.svg";

import { PollBubbleStyle } from "../../";
import { PollOptionBubbleConfiguration } from "../../";

/**
 * @class PollBubbleConfiguration
 * @description PollBubbleConfiguration class is used for defining the PollBubbleConfiguration templates.
 * @param {string} optionIconURL
 * @param {object} style
 */

class PollBubbleConfiguration {
  constructor({
    optionIconURL = ImageURL,
    style = new PollBubbleStyle({}),
    pollOptionBubbleConfiguration = new PollOptionBubbleConfiguration({}),
  }) {
    this.style = new PollBubbleStyle(style ?? {});
    this.optionIconURL = optionIconURL;
    this.pollOptionBubbleConfiguration = new PollOptionBubbleConfiguration(
      pollOptionBubbleConfiguration || {}
    );
  }
}

export { PollBubbleConfiguration };
