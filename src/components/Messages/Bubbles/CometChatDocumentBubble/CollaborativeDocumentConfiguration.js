import collaborativeIconURL from "./resources/collaborative-document.svg";

import { DocumentBubbleStyle } from "../../";

/**
 * @class CollaborativeDocumentConfiguration
 * @description CollaborativeDocumentConfiguration class is used for defining the CollaborativeDocumentConfiguration templates.
 * @param {string} iconURL
 * @param {object} style
 */

class CollaborativeDocumentConfiguration {
  constructor({
    iconURL = collaborativeIconURL,
    style = new DocumentBubbleStyle({}),
  }) {
    this.style = new DocumentBubbleStyle(style ?? {});
    this.iconURL = iconURL;
  }
}

export { CollaborativeDocumentConfiguration };
