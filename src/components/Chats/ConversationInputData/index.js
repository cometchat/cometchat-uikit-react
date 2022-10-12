import { InputData } from "../InputData"

/**
 * @class ConversationInputData
 * @param {string} id
 * @param {boolean} thumbnail
 * @param {boolean} status
 * @param {boolean} title
 * @param {Function} subtitle
 * @param {boolean} unreadCount
 * @param {boolean} timestamp
 * @param {boolean} readreceipt
 */

class ConversationInputData extends InputData {

    constructor({
        id = "",
        thumbnail = true,
        status = true,
        title = true,
        subtitle = () => { },
        unreadCount = true,
        timestamp = true,
        readreceipt = true
    }) {
        super({
            id,
            thumbnail,
            status,
            title,
            subtitle
        });

        // this.id = id;
        // this.thumbnail = thumbnail;
        // this.status = status;
        // this.title = title;
        // this.subtitle = subtitle;
        this.unreadCount = unreadCount
        this.timestamp = timestamp;
        this.readreceipt = readreceipt;
    }
}
export { ConversationInputData };