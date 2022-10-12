import { ConversationListCustomView } from "../../../Chats/ConversationListCustomView";
import { ConversationListStyles } from "../../../Chats/";
import { ConversationListItemConfiguration } from "./ConversationListItemConfiguration";

/**
 * @class ConversationListConfiguration
 * @param {Number} limit
 * @param {String} conversationType
 * @param {false} userAndGroupTags
 * @param {Array} tags
 * @param {Boolean} loadingIconURL
 * @param {Object} customView
 * @param {false} hideError
 * @param {false} enableSoundForMessages
 * @param {String} customIncomingMessageSound
 * @param {Object} style
 * @param {Object} conversationListItemConfiguration
 */
class ConversationListConfiguration {
    constructor({
        limit = 30,
        conversationType = "both",
        userAndGroupTags = false,
        tags = [],
        loadingIconURL = "",
        customView = new ConversationListCustomView({}),
        hideError = false,
        enableSoundForMessages = false,
        customIncomingMessageSound = "",
        style = new ConversationListStyles({}),
        conversationListItemConfiguration = new ConversationListItemConfiguration({}),
    }) {
        this.limit = limit;
        this.conversationType = conversationType;
        this.userAndGroupTags = userAndGroupTags;
        this.tags = tags;
        this.loadingIconURL = loadingIconURL;
        this.customView = new ConversationListCustomView(customView ?? {});
        this.hideError = hideError;
        this.enableSoundForMessages = enableSoundForMessages;
        this.customIncomingMessageSound = customIncomingMessageSound;
        this.style = new ConversationListStyles(style ?? {});
        this.conversationListItemConfiguration = new ConversationListItemConfiguration(conversationListItemConfiguration ?? {});
    }
}

export { ConversationListConfiguration };