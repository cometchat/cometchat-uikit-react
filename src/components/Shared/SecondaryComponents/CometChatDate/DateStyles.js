import { BaseStyles } from "../../../Shared";
/**
 * @class DateStyles
 * @param {String} textFont
 * @param {String} textColor
 */

class DateStyles extends BaseStyles {

    constructor({
        textColor = "",
        textFont = "",

        width,
        height,
        background,
        activeBackground,
        border,
        borderRadius
    }) {
        super({
            width,
            height,
            background,
            activeBackground,
            border,
            borderRadius
        });
        this.textColor = textColor;
        this.textFont = textFont;
    }
}
export { DateStyles };