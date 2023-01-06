import { TextBubbleStyle } from "../../";

/**
 * @class TextBubbleConfiguration
 * @description TextBubbleConfiguration class is used for defining the TextBubbleConfiguration templates.
 * @param {boolean} showEmojiInLargerSize
 * @param {object} style
 */

class TextBubbleConfiguration {
  constructor({
    showEmojiInLargerSize = false,
    style = new TextBubbleStyle({}),
  }) {
    this.style = new TextBubbleStyle(style ?? {});
    this.showEmojiInLargerSize = showEmojiInLargerSize;
  }
}

export { TextBubbleConfiguration };
