import { CometChatTheme, CometChatActionsIcon, CometChatActionsView, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { MessageTranslationStyle } from "@cometchat/uikit-shared";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { MessageTranslationConfiguration } from "./MessageTranslationConfiguration";
export declare class MessageTranslationExtensionDecorator extends DataSourceDecorator {
    configuration?: MessageTranslationConfiguration;
    newDataSource: DataSource;
    constructor(dataSource: DataSource, configuration?: MessageTranslationConfiguration);
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): (CometChatActionsIcon | CometChatActionsView)[];
    getTranslationStyle: (_alignment: MessageBubbleAlignment, _theme: CometChatTheme) => MessageTranslationStyle;
    getTextMessageStyle(_alignment: MessageBubbleAlignment, _theme: CometChatTheme): {
        textFont: string;
        textColor: string;
    };
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
    checkIfOptionExist(template: (CometChatActionsIcon | CometChatActionsView)[], id: string): boolean;
    getId(): string;
}
