import { CometChatDetailsTemplate } from "@cometchat/uikit-resources";
export declare class CallingDetailsUtils {
    static getDetailsTemplate(user?: CometChat.User, group?: CometChat.Group): Array<CometChatDetailsTemplate>;
    private static getCallButtons;
    static getPrimaryDetailsTemplate(user1?: CometChat.User, group1?: CometChat.Group): CometChatDetailsTemplate;
    private static getPrimaryOptions;
}
