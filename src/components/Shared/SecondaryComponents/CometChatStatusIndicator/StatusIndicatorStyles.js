import { BaseStyles } from "../../../Shared";
/**
 * @class StatusIndicatorStyles
 * @param {String} backgroundColor
 */

class StatusIndicatorStyles extends BaseStyles {

    constructor({
        backgroundColor = "",

        width = "14px",
        height = "14px",
        background,
        activeBackground,
        border = "",
        borderRadius = "50%"
    }) {
        super({
            width,
            height,
            background,
            activeBackground,
            border,
            borderRadius
        });
        this.backgroundColor = backgroundColor;
    }
}
export { StatusIndicatorStyles };