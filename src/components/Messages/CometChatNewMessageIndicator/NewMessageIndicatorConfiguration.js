import { NewMessageIndicatorStyle } from "../";
/**
 * @class newMessageIndicatorConfiguration
 * @description newMessageIndicator class is used for defining the newMessageIndicator templates.
 * @param {String} IconURL
 * @param {function} onClick
 * @param {object} style
 */

class NewMessageIndicatorConfiguration {
  constructor({
    IconURL = "",
    onClick = () => {},
    style = new NewMessageIndicatorStyle({}),
  }) {
    this.IconURL = IconURL;
    this.onClick = onClick;
    this.style = new NewMessageIndicatorStyle(style || {});
  }
}

export { NewMessageIndicatorConfiguration };
