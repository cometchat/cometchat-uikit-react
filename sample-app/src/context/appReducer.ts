interface defaultStateType {
    activeTab: string;
    selectedItem: CometChat.Conversation | undefined;
    selectedItemUser: CometChat.User | undefined;
    selectedItemGroup: CometChat.Group | undefined;
    selectedItemCall: CometChat.Call | undefined;
    sideComponent: { visible: boolean, type: string };
    threadedMessage: CometChat.BaseMessage | undefined;
    showNewChat: boolean;
    showJoinGroup: boolean;
    newChat?: {
        user: CometChat.User,
        group: CometChat.Group
    }
    isFreshChat?: boolean;
}

export const defaultAppState: defaultStateType = {
    activeTab: "chats",
    selectedItem: undefined,
    selectedItemUser: undefined,
    selectedItemGroup: undefined,
    selectedItemCall: undefined,
    sideComponent: { visible: false, type: "" },
    threadedMessage: undefined,
    showNewChat: false,
    showJoinGroup: false,
    isFreshChat: false,
}

export const appReducer = (state = defaultAppState, action: any) => {
    switch (action.type) {
        case "updateActiveTab": {
            return { ...state, ["activeTab"]: action.payload };
        }
        case "updateSelectedItem": {
            return { ...state, ["selectedItem"]: action.payload };
        }
        case "updateSelectedItemUser": {
            return { ...state, ["selectedItemUser"]: action.payload };
        }
        case "updateSelectedItemGroup": {
            return { ...state, ["selectedItemGroup"]: action.payload };
        }
        case "updateSelectedItemCall": {
            return { ...state, ["selectedItemCall"]: action.payload };
        }
        case "updateSideComponent": {
            return { ...state, ["sideComponent"]: action.payload };
        }
        case "updateThreadedMessage": {
            return { ...state, ["threadedMessage"]: action.payload };
        }
        case "showNewChat": {
            return { ...state, ["showNewChat"]: action.payload };
        }
        case "newChat": {
            return { ...state, ["newChat"]: action.payload, ["showNewChat"]: false };
        }
        case "updateShowJoinGroup": {
            return { ...state, ["showJoinGroup"]: action.payload };
        }
        case "resetAppState": {
            return defaultAppState;
        }
        case 'updateIsFreshChat': {
            return { ...state, isFreshChat: action.payload };
          }

        default: {
            return state;
        }
    }

}