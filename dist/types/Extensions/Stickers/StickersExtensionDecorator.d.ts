import { CometChatMessageTemplate, CometChatTheme } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { StickersConfiguration } from "./StickersConfiguration";
export declare class StickersExtensionDecorator extends DataSourceDecorator {
    configuration?: StickersConfiguration;
    newDataSource: DataSource;
    showStickerKeyboard: boolean;
    theme: CometChatTheme;
    private id;
    private user;
    private group;
    constructor(dataSource: DataSource, configuration?: StickersConfiguration);
    getDataSource(): DataSource;
    getAllMessageTemplates(theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getAuxiliaryOptions(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): any;
    getStickerAuxiliaryButton(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): import("react/jsx-runtime").JSX.Element;
    sendSticker(event: any): void;
    getSticker(message: CometChat.CustomMessage): any;
    getStickerMessageContentView(stickerMessage: CometChat.CustomMessage, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    getStickerTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageCategories(): string[];
    getAllMessageTypes(): string[];
    getId(): string;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
}
