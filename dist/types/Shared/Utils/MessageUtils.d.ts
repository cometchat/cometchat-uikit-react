import { CometChatMessageTemplate, CometChatTheme, MessageBubbleAlignment } from "@cometchat/uikit-resources";
export declare class MessageUtils {
    messageBubbleStyle(message: CometChat.BaseMessage, theme: CometChatTheme, alignment: MessageBubbleAlignment, currentUser: any): {
        background: string;
        border: string;
        borderRadius: string;
    } | {
        background: string | undefined;
        borderRadius: string;
        border?: undefined;
    };
    getContentView(message: CometChat.BaseMessage, template: CometChatMessageTemplate): any;
    getBubbleWrapper(message: CometChat.BaseMessage, template: CometChatMessageTemplate): any;
    getMessageBubble(baseMessage: CometChat.BaseMessage, template: CometChatMessageTemplate, messageBubbleStyle: any, alignment: MessageBubbleAlignment): any;
    getUserStatusVisible(user: CometChat.User | CometChat.GroupMember | any): boolean;
}
