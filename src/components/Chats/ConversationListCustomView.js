/**
 * @class ConversationListCustomView
 * @description ConversationListCustomView class is used for defining the customView.
 * @param {any} loading
 * @param {any} empty
 * @param {any} error
 */
 class ConversationListCustomView {
    constructor({
        loading = "",
        empty = "",
        error = ""
    }) {
        this.loading = loading;
        this.empty = empty;
        this.error = error
    }
}
export { ConversationListCustomView };
