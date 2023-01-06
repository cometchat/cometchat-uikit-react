import { BaseStyles } from "../../../Shared";
/**
 * @class PopoverStyle
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} boxShadow
 */

class PopoverStyle extends BaseStyles {
  constructor({
    width = "",
    height = "",
    background = "",
    border = "",
    borderRadius = "",
    boxShadow = "",
  }) {
    super({
      width,
      height,
      background,
      border,
      borderRadius,
    });
    this.boxShadow = boxShadow;
  }
}
export { PopoverStyle };
