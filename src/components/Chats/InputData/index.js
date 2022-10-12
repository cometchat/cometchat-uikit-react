/**
 * @class InputData
 * @param {string} id
 * @param {boolean} thumbnail
 * @param {boolean} status
 * @param {boolean} title
 * @param {Function} subtitle
 */
class InputData {
    constructor({
        id = "",
        thumbnail = true,
        status = true,
        title = true,
        subtitle = () => { }
    }) {
        this.id = id;
        this.thumbnail = thumbnail;
        this.status = status;
        this.title = title;
        this.subtitle = subtitle;
    }
}
export { InputData };