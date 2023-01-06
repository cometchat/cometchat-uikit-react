import addReactionIcon from "./resources/reactions.svg";
import { MessageReactionsStyle } from "../";
/**
 * @class MessageReactionConfiguration
 * @description MessageReactionConfiguration class is used for defining the MessageReactionConfiguration
 * @param {String} addReactionIconURL
 * @param {Object} style
 */
class MessageReactionsConfiguration {
  constructor({
    addReactionIconURL = addReactionIcon,
    style = new MessageReactionsStyle({}),
  }) {
    this.addReactionIconURL = addReactionIconURL;
    this.style = new MessageReactionsStyle(style || {});
  }
}

export { MessageReactionsConfiguration };
