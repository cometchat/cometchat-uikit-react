import {
	ConversationListConfiguration
} from ".";
import { ConversationsStyles } from "../../../Chats/";

/**
 * @class ConversationsConfiguration
 * @param {String} backButtonIconURL
 * @param {String} startConversationIconURL
 * @param {String} searchIconURL
 * @param {String} showBackButton
 * @param {Boolean} hideStartConversation
 * @param {Boolean} hideSearch
 * @param {Object} style
 * @param {Object} conversationListConfiguration
 */
class ConversationsConfiguration {
	constructor({
		backButtonIconURL = "",
		startConversationIconURL = "",
		searchIconURL = "",
		showBackButton = false,
		hideStartConversation = true,
		hideSearch = true,
		style = new ConversationsStyles({}),
		conversationListConfiguration = new ConversationListConfiguration({}),
	}) {
		this.backButtonIconURL = backButtonIconURL;
		this.startConversationIconURL = startConversationIconURL;
		this.searchIconURL = searchIconURL;
		this.showBackButton = showBackButton;
		this.hideStartConversation = hideStartConversation;
		this.hideSearch = hideSearch;
		this.style = new ConversationsStyles(style ?? {});
		this.conversationListConfiguration = new ConversationListConfiguration(conversationListConfiguration ?? {});
	}
}

export { ConversationsConfiguration };