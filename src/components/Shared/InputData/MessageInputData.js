import { InputData } from "./InputData";
/**
 * @class MessageInputData
 * @description MessageInputData class is used for defining the structure of message input Data
 * @param {String} id
 * @param {String} thumbnail
 * @param {String} title
 * @param {String} timestamp
 * @param {String} readReceipt
 */
class MessageInputData extends InputData {
	constructor(
		{ id = true,
			thumbnail = false,
			title = true,
			timestamp = true,
			readReceipt = true, }
	) {
		super({ id, thumbnail, title });
		this.timestamp = timestamp;
		this.readReceipt = readReceipt;
	}
}

export { MessageInputData };
