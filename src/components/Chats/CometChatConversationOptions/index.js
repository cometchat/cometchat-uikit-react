/**
 * @class CometChatConversationOptions
 * @param {String} id
 * @param {String} title
 * @param {String} iconURL
 * @param {Function} onClick
 */
class CometChatConversationOptions {
    constructor({
        id = "",
        title = "",
        iconURL = "",
        onClick = () => { }
    }) {
        this.id = id;
        this.title = title;
        this.iconURL = iconURL;
        this.onClick = onClick;
    }
}
export { CometChatConversationOptions };