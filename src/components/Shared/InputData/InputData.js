/**
 * @class InputData
 * @description InputData class is data model for several list item and data Item components
 * @param {String} id
 * @param {String} thumbnail
 * @param {String} status
 * @param {String} title
 * @param {String} subtitle
 */

 class InputData {
	constructor({
		id = "",
		thumbnail = true,
		status = true,
		title = true,
		subtitle = null 
    }) {
        this.id = id;
        this.thumbnail = thumbnail;
        this.status = status;
        this.title = title;
        this.subtitle = subtitle;
    }
}

export { InputData };
