import defaultImg from "./resources/heart.png";
import { LiveReactionsStyle } from "../";

/**
 * @class LiveReactionConfiguration
 * @description LiveReactionConfiguration class is used for defining the LiveReaction templates.
 * @param {String} liveReactionIconURL
 *
 */
class LiveReactionConfiguration {
  constructor({
    liveReactionIcon = defaultImg,
    style = new LiveReactionsStyle({}),
  }) {
    this.liveReactionIconURL = liveReactionIcon;
    this.style = new LiveReactionsStyle(style || {});
  }
}

export { LiveReactionConfiguration };
