import whiteBoardIconURL from "../../../Messages/Bubbles/CometChatWhiteboardBubble/resources/collaborative-whiteboard.svg";

import { WhiteboardBubbleStyle } from "../../";

/**
 * @class CollaborativeWhiteboardConfiguration
 * @description CollaborativeWhiteboardConfiguration class is used for defining the CollaborativeWhiteboardConfiguration templates.
 * @param {string} iconURL
 * @param {object} style
 */

class CollaborativeWhiteboardConfiguration {
  constructor({
    iconURL = whiteBoardIconURL,
    style = new WhiteboardBubbleStyle({}),
  }) {
    this.style = new WhiteboardBubbleStyle(style ?? {});
    this.iconURL = iconURL;
  }
}

export { CollaborativeWhiteboardConfiguration };
