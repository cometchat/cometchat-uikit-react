/**
 * @class CometChatEmoji
 * @description CometChatEmoji class is used for defining the emoji.
 *
 * @param {String} char
 * @param {Array} keywords
 */
class CometChatEmoji {
	char = "";
	keywords = [];
	constructor({ char, keywords }) {
		this.char = char;
		this.keywords = keywords;
	}
}

export { CometChatEmoji };
