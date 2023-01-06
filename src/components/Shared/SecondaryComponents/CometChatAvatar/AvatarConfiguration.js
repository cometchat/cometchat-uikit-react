import { AvatarStyle } from "../../../Shared";

/**
 * @class AvatarConfiguration
 * @param {Object} style
 * @param {String} image
 * @param {String} name
 */
class AvatarConfiguration {
  constructor({ style = new AvatarStyle({}), image = "", name = "" }) {
    this.style = new AvatarStyle(style ?? {});
    this.image = image;
    this.name = name;
  }
}

export { AvatarConfiguration };
