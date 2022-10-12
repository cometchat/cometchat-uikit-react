import { BaseStyles } from "../../../Shared"
/**
 * @class ListItemStyles
 * @param {String} textFont
 * @param {String} textColor
 * @param {String} outerView
 * @param {String} outerViewSpacing
 */

 class ListItemStyles extends BaseStyles {

    constructor({
        textColor = "",
        textFont = "",
        outerView = "",
        outerViewSpacing = "",
        
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
        this.outerView = outerView;
        this.outerViewSpacing = outerViewSpacing;
    }
}
export { ListItemStyles };