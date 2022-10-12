import { BaseStyles } from "../../Shared/Base/BaseStyles";

/**
 * @class ConversationsStyles
 * @description ConversationsStyles class is used for defining the styles for conversations.
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} titleColor
 * @param {String} titleFont
 * @param {String} backIconTint
 * @param {String} searchBorder
 * @param {String} startConversationIconTint
 * @param {String} searchBorderRadius
 * @param {String} searchBackground
 * @param {String} searchTextFont
 * @param {String} searchTextColor
 * @param {String} searchIconTint
 */

class ConversationsStyles extends BaseStyles {

    constructor({
        width = "280px",
        height = "100%",
        background = "",
        border = "",
        borderRadius = "0",

        titleFont = "",
        titleColor = "",
        backIconTint = "",
        startConversationIconTint = "",
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

        this.titleColor = titleColor;
        this.titleFont = titleFont;
        this.backIconTint = backIconTint
        this.searchBorder = searchBorder
        this.startConversationIconTint = startConversationIconTint
        this.searchBorderRadius = searchBorderRadius
        this.searchBackground = searchBackground
        this.searchTextFont = searchTextFont
        this.searchTextColor = searchTextColor
        this.searchIconTint = searchIconTint
    }
}
export { ConversationsStyles }