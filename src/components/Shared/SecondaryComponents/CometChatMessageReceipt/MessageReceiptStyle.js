import { BaseStyles } from "../..";
/**
 * @class MessageReceiptStyle
 */

class MessageReceiptStyle extends BaseStyles {
  constructor({
    width = "24px",
    height = "24px",
    background = "",
    border = "",
    borderRadius = "",
    activeBackground = "",
  }) {
    super({
      width,
      height,
      background,
      activeBackground,
      border,
      borderRadius,
    });
  }
}
export { MessageReceiptStyle };
