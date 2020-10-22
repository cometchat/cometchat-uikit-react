import * as enums from "../../util/enums";
import { validateWidgetSettings } from "../../util/common";

class MessageFilter {

    categories = {};
    types = null;

    constructor() {

        this.categories = { 
            [enums.CATEGORY_MESSAGE]: enums.CATEGORY_MESSAGE, 
            [enums.CATEGORY_CUSTOM]: enums.CATEGORY_CUSTOM,
            [enums.CATEGORY_ACTION]: enums.CATEGORY_ACTION,
            [enums.CATEGORY_CALL]: enums.CATEGORY_CALL,
        };

        this.types = {
            [enums.MESSAGE_TYPE_TEXT]: enums.MESSAGE_TYPE_TEXT,
            [enums.MESSAGE_TYPE_IMAGE]: enums.MESSAGE_TYPE_IMAGE,
            [enums.MESSAGE_TYPE_VIDEO]: enums.MESSAGE_TYPE_VIDEO,
            [enums.MESSAGE_TYPE_AUDIO]: enums.MESSAGE_TYPE_AUDIO,
            [enums.MESSAGE_TYPE_FILE]: enums.MESSAGE_TYPE_FILE,
            [enums.CUSTOM_TYPE_POLL]: enums.CUSTOM_TYPE_POLL,
            [enums.ACTION_TYPE_GROUPMEMBER]: enums.ACTION_TYPE_GROUPMEMBER,
            [enums.CALL_TYPE_AUDIO]: enums.CALL_TYPE_AUDIO,
            [enums.CALL_TYPE_VIDEO]: enums.CALL_TYPE_VIDEO
        }

        // console.log("this.categories ", this.categories);
        // console.log("this.types", this.types);
    }

    getCategories = (widgetSettings) => {

        if (validateWidgetSettings(widgetSettings, "hide_join_leave_notifications") === true) {
            delete this.categories[enums.CATEGORY_ACTION];
        }

        if (validateWidgetSettings(widgetSettings, "show_call_notifications") === false) {
            delete this.categories[enums.CATEGORY_CALL];
        }

        //console.log("this.categories ", this.categories);
        
        return Object.keys(this.categories);
    }

    getTypes = (widgetSettings) => {

        if (validateWidgetSettings(widgetSettings, "hide_join_leave_notifications") === true) {
            delete this.types[enums.ACTION_TYPE_GROUPMEMBER];
        }

        if (validateWidgetSettings(widgetSettings, "show_call_notifications") === false) {
            delete this.types[enums.CALL_TYPE_AUDIO];
            delete this.types[enums.CALL_TYPE_VIDEO];
        }

        //console.log("this.types", this.types);

        return Object.keys(this.types);
    }
}

export default MessageFilter;