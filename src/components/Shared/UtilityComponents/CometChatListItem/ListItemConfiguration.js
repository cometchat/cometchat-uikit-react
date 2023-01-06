import uploadFile from "../../../Messages/CometChatMessageComposer/resources/file-upload.svg";
import { ListItemStyle } from "../../../Shared";

/**
 * @class ListItemConfiguration
 * @description ListItemConfiguration class is used for defining the ListItem templates.
 * @param {String} iconURL
 * @param {String} text
 * @param {Object} tail
 * @param {Function} onItemClick
 * @param {Number} id
 * @param {Object} style
 */

class ListItemConfiguration {
  constructor(
    id = null,
    text = null,
    tail = null,
    iconURL = null,
    onItemClick = null,
    style = new ListItemStyle({})
  ) {
    this.id = id;
    this.text = text;
    this.tail = tail;
    this.iconURL = iconURL || uploadFile;
    this.onItemClick = onItemClick;
    this.style = new ListItemStyle(style ?? {});
  }
}

export { ListItemConfiguration };
