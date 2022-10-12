import { BaseStyles } from "../../Base/BaseStyles";

/**
 * @class ListBaseStyles
 * @description ListBaseStyles class is used for defining the styles for conversation list.
 * @param {String} width
 * @param {String} height
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} titleFont
 * @param {String} titleColor
 * @param {String} backIconTint
 * @param {String} searchBorder
 * @param {String} searchBorderRadius
 * @param {String} searchBackground
 * @param {String} searchTextFont
 * @param {String} searchTextColor
 * @param {String} searchIconTint
 */

class ListBaseStyles extends BaseStyles {

    constructor({
        width = "100%",
        height = "100%",
        border = "",
        borderRadius = "0",
        background = "",
        titleFont = "",
        titleColor = "",
        backIconTint = "",
        searchBorder = "",
        searchBorderRadius = "8px",
        searchBackground = "",
        searchTextFont = "",
        searchTextColor = "",
        searchIconTint = "",
    }) {
        super({
            width,
            height,
            background,
            border,
            borderRadius
        });
        
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.backIconTint = backIconTint;
        this.searchBorder = searchBorder;
        this.searchBorderRadius = searchBorderRadius;
        this.searchBackground = searchBackground;
        this.searchTextFont = searchTextFont;
        this.searchTextColor = searchTextColor;
        this.searchIconTint = searchIconTint;
    }
}
export { ListBaseStyles }