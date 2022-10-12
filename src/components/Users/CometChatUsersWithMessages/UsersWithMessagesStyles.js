import { BaseStyles } from "../../Shared/Base/BaseStyles"
/**
 * @class UsersWithMessagesStyles
 * @description UsersWithMessagesStyles class is used for defining the styles for UsersWithMessagesStyles.
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} messageTextColor
 * @param {String} messageTextFont
 */

class UsersWithMessagesStyles extends BaseStyles {

    constructor({
        width = "100vw",
        height = "100vh",
        background = "",
        border = "",
        borderRadius = "0",
        messageTextColor = "",
        messageTextFont = "",
    }) {
        super({
            width,
            height,
            background,
            border,
            borderRadius
        });

        this.messageTextColor = messageTextColor;
        this.messageTextFont = messageTextFont;
    }
}
export { UsersWithMessagesStyles }