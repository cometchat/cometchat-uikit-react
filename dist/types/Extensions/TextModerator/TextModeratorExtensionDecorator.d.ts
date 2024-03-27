import { CometChatTheme, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class TextModeratorExtensionDecorator extends DataSourceDecorator {
    getId(): string;
    getModeratedtext(message: CometChat.TextMessage): string;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
}
