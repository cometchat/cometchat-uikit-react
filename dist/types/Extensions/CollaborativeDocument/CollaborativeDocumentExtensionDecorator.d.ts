import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CollaborativeDocumentConfiguration } from "./CollaborativeDocumentConfiguration";
export declare class CollaborativeDocumentExtensionDecorator extends DataSourceDecorator {
    configuration?: CollaborativeDocumentConfiguration;
    newDataSource: DataSource;
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: CollaborativeDocumentConfiguration);
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(_theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getDocumentTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getDocumentContentView(documentMessage: CometChat.CustomMessage, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    launchCollaborativeDocument(documentURL: string): void;
    getDocumentURL(message: CometChat.CustomMessage): any;
    getAttachmentOptions(theme: CometChatTheme, id: any): CometChatMessageComposerAction[];
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
}
