/**
 * @class CometChatEmojiCategory
 * @description CometChatEmojiCategory class is used for defining the category.
 * @param {String} id
 * @param {String} name
 * @param {String} symbol
 * @param {Object} emojis
 */
class CometChatEmojiCategory {
	id = "";
	name = "";
	symbol = "";
	emojis = {};
	constructor({ id, name, emojis, symbol }) {
		this.id = id;
		this.name = name;
		this.emojis = emojis;
		this.symbol = symbol;
	}
}

export { CometChatEmojiCategory };
