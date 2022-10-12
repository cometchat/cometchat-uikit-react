import { BaseStyles } from "../../../Shared";
/**
 * @class AvatarStyles
 * @param {String} textFont
 * @param {String} textColor
 * @param {String} outerView
 * @param {String} outerViewSpacing
 */

class AvatarStyles extends BaseStyles {

    constructor({
        textColor = "",
        textFont = "",
        outerView = "",
        outerViewSpacing = "0px",
        backgroundColor = "",
        backgroundSize = "cover",

        width = "36px",
        height = "36px",
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
        
        this.textColor = textColor;
        this.textFont = textFont;
        this.outerView = outerView;
        this.outerViewSpacing = outerViewSpacing;
        this.backgroundColor = backgroundColor;
        this.backgroundSize = backgroundSize;
    }
}
export { AvatarStyles };