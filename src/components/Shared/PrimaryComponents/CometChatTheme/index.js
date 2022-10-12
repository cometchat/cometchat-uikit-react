import { Palette } from "./Palette";
import { Typography } from "./Typography";


/**
 * @class CometChatTheme
 * @param {Object} palette
 * @param {Object} typography
 */
class CometChatTheme {
  constructor({
    palette = new Palette({}),
    typography = new Typography({}),
  }) {
    this.palette = new Palette(palette);
    this.typography = new Typography(typography);
  }
}

export {
  CometChatTheme,
  Palette,
  Typography,
};
