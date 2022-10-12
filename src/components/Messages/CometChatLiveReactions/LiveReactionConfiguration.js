import defaultImg from "./resources/heart.png";

/**
 * @class LiveReactionConfiguration
 * @description LiveReactionConfiguration class is used for defining the LiveReaction templates.
 * @param {String} liveReactionIconURL
 */
class LiveReactionConfiguration {
  constructor({ liveReactionIcon = defaultImg }) {
    this.liveReactionIconURL = liveReactionIcon;
  }
}

export { LiveReactionConfiguration };
