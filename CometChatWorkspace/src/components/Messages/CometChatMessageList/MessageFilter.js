import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums";

class MessageFilter {

	categories = {};
	types = null;
	context;

	constructor(context) {

        this.context = context;

		this.categories = {
			[CometChat.CATEGORY_MESSAGE]: CometChat.CATEGORY_MESSAGE,
			[CometChat.CATEGORY_CUSTOM]: CometChat.CATEGORY_CUSTOM,
			[CometChat.CATEGORY_ACTION]: CometChat.CATEGORY_ACTION,
			[CometChat.CATEGORY_CALL]: CometChat.CATEGORY_CALL,
		};

		this.types = {
			[CometChat.MESSAGE_TYPE.TEXT]: CometChat.MESSAGE_TYPE.TEXT,
			[CometChat.MESSAGE_TYPE.IMAGE]: CometChat.MESSAGE_TYPE.IMAGE,
			[CometChat.MESSAGE_TYPE.VIDEO]: CometChat.MESSAGE_TYPE.VIDEO,
			[CometChat.MESSAGE_TYPE.AUDIO]: CometChat.MESSAGE_TYPE.AUDIO,
			[CometChat.MESSAGE_TYPE.FILE]: CometChat.MESSAGE_TYPE.FILE,
			[enums.CUSTOM_TYPE_POLL]: enums.CUSTOM_TYPE_POLL,
			[enums.CUSTOM_TYPE_STICKER]: enums.CUSTOM_TYPE_STICKER,
			[enums.CUSTOM_TYPE_DOCUMENT]: enums.CUSTOM_TYPE_DOCUMENT,
			[enums.CUSTOM_TYPE_WHITEBOARD]: enums.CUSTOM_TYPE_WHITEBOARD,
			[enums.CUSTOM_TYPE_MEETING]: enums.CUSTOM_TYPE_MEETING,
			[CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER]: CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER,
			[CometChat.CALL_TYPE.AUDIO]: CometChat.CALL_TYPE.AUDIO,
			[CometChat.CALL_TYPE.VIDEO]: CometChat.CALL_TYPE.VIDEO,
		};
	}

	getCategories = () => {

		const categories = {...this.categories};

		return new Promise(resolve => {
			this.context.FeatureRestriction.isGroupActionMessagesEnabled()
				.then(response => {
					if (response === false) {
						delete categories[CometChat.CATEGORY_ACTION];
					}
					return categories;
				})
				.catch(error => {
					delete categories[CometChat.CATEGORY_ACTION];
					return categories;
				})
				.then(categories => {
					this.context.FeatureRestriction.isCallActionMessagesEnabled()
						.then(response => {
							if (response === false) {
								delete categories[CometChat.CATEGORY_CALL];
							}
							resolve(categories);
						})
						.catch(error => {
							delete categories[CometChat.CATEGORY_CALL];
							resolve(categories);
						});
				});
		});
	};

	getTypes = () => {

        const types = {...this.types};
        return new Promise(resolve => resolve(types));
	};
}

export default MessageFilter;