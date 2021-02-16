import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums";
import { validateWidgetSettings } from "../../../util/common";

class MessageFilter {

    categories = {};
    types = null;

    constructor() {

        this.categories = { 
            [CometChat.CATEGORY_MESSAGE]: CometChat.CATEGORY_MESSAGE, 
            [enums.CATEGORY_CUSTOM]: enums.CATEGORY_CUSTOM,
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
            [enums.ACTION_TYPE_GROUPMEMBER]: enums.ACTION_TYPE_GROUPMEMBER,
            [CometChat.CALL_TYPE.AUDIO]: CometChat.CALL_TYPE.AUDIO,
            [CometChat.CALL_TYPE.VIDEO]: CometChat.CALL_TYPE.VIDEO
        }
    }

    getCategories = (widgetSettings) => {

        if (validateWidgetSettings(widgetSettings, "hide_join_leave_notifications") === true) {
            delete this.categories[CometChat.CATEGORY_ACTION];
        }

        if (validateWidgetSettings(widgetSettings, "show_call_notifications") === false) {
            delete this.categories[CometChat.CATEGORY_CALL];
        }
        
        return Object.keys(this.categories);
    }

    getTypes = (widgetSettings) => {

        if (validateWidgetSettings(widgetSettings, "hide_join_leave_notifications") === true) {
            delete this.types[enums.ACTION_TYPE_GROUPMEMBER];
        }

        if (validateWidgetSettings(widgetSettings, "show_call_notifications") === false) {
            delete this.types[CometChat.CALL_TYPE.AUDIO];
            delete this.types[CometChat.CALL_TYPE.VIDEO];
        }

        return Object.keys(this.types);
    }
}

export default MessageFilter;