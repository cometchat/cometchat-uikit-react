import { CometChatCallDetailsTemplate, CometChatTheme } from "@cometchat/uikit-resources";
export declare class CallingDetailsUtils {
    static getDefaultCallTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): Array<CometChatCallDetailsTemplate>;
    private static getCallButtons;
    static getPrimaryDetailsTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): CometChatCallDetailsTemplate;
    static getSecondaryDetailsTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): CometChatCallDetailsTemplate;
    private static getPrimaryOptions;
    private static getSecondaryOptions;
    private static generateCallDetailsHTML;
    private static generateCallOptionsHTML;
}
