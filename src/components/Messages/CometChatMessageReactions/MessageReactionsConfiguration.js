import addReactionIcon from "./resources/reactions.svg";
/**
 * @class MessageReactionConfiguration
 * @description MessageReactionConfiguration class is used for defining the MessageReactionConfiguration
 * @param {String} addReactionIconURL
 */
class MessageReactionsConfiguration {
	constructor({ addReactionIconURL = addReactionIcon }) {
		this.addReactionIconURL = addReactionIconURL;
	}
}

export { MessageReactionsConfiguration };
