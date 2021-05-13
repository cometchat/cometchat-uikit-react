export class UIKitSettings {

    widgetSettings;

    static userListFilterOptions = {
        "ALL": "all",
        "NONE": "none",
        "FRIENDS": "friends",
    }

    static groupListFilterOptions = {
        "PUBLIC": "public_groups",
        "PASSWORD": "password_protected_groups",
        "PUBLIC_AND_PASSWORD": "public_and_password_protected_groups"
    }
    
    static chatListFilterOptions = {
        "USERS": "users",
        "GROUPS": "groups",
        "USERS_AND_GROUPS": "all_chats"
    }

    userListMode = UIKitSettings.userListFilterOptions["ALL"];
    groupListMode = UIKitSettings.groupListFilterOptions["PUBLIC_AND_PASSWORD"];
    chatListMode = UIKitSettings.chatListFilterOptions["USERS_AND_GROUPS"];
    enableSoundForMessages = true;
    enableSoundForCalls = true;
    chatWindow = window;
    document = window.document;
    customCSS = null;

    validateWidgetSettings = (section, checkAgainst) => {

        let output = null;

        if (this.widgetSettings && this.widgetSettings.hasOwnProperty(section)) {

            if (this.widgetSettings[section].hasOwnProperty(checkAgainst)) {
                output = this.widgetSettings[section][checkAgainst];
            } else {
                output = false;
            }
        }

        return output;
    }

    getCustomCSS = () => {
        return this.customCSS
    }

    setCustomCSS = (customCSS) => {
        this.customCSS = customCSS;
    }

    setChatWindow = (chatWindow) => {
        this.chatWindow = chatWindow;
    }

    getChatWindow = () => {
        return this.chatWindow;
    }

    setDocument = (document) => {
        this.document = document;
    }

    getDocument = () => {
        return this.document;
    }

    getChatListMode = () => {
        return this.chatListMode
    }

    setChatListMode = (option) => {

        if (!option.trim().length) {
            return false;
        }

        const chatListFilterKey = this.returnMatchedKey(UIKitSettings.chatListFilterOptions, option);
        if (chatListFilterKey) {
            this.chatListMode = UIKitSettings.chatListFilterOptions[chatListFilterKey];
        }
    }

    returnMatchedKey = (matchWith, optionToMatch) => {

        for (const [key, value] of Object.entries(matchWith)) {
            if (value === optionToMatch) {
                return key;
            }
        }

        return false;
    }

    getUserListMode = () => {
        return this.userListMode;
    }

    setUserListMode = () => {

    }

    getGroupListMode = () => {
        return this.groupListMode;
    }

    setGroupListFilter = () => {

    }

    setEnableSoundForMessages = (enableSound) => {
        this.enableSoundForMessages = enableSound;
    }

    getEnableSoundForMessages = () => {
        return this.enableSoundForMessages;
    }

    setEnableSoundForCalls = (enableSound) => {
        this.enableSoundForCalls = enableSound;
    }

    getEnableSoundForCalls = () => {
        return this.enableSoundForCalls;
    }
}
