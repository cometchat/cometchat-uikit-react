import fileIconURL from "../../../Messages/Bubbles/CometChatFileBubble/resources/file-upload.svg";
import { FileBubbleStyle } from "../../";

/**
 * @class FileBubbleConfiguration
 * @description FileBubbleConfiguration class is used for defining the FileBubbleConfiguration templates.
 * @param {string} iconURL
 * @param {object} style
 */

class FileBubbleConfiguration {
  constructor({ iconURL = fileIconURL, style = new FileBubbleStyle({}) }) {
    this.style = new FileBubbleStyle(style ?? {});
    this.iconURL = iconURL;
  }
}

export { FileBubbleConfiguration };
