import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CollaborativeWhiteboardConfiguration } from "./CollaborativeWhiteboardConfiguration";
export declare class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
    configuration?: CollaborativeWhiteboardConfiguration;
    newDataSource: DataSource;
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: CollaborativeWhiteboardConfiguration);
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getWhiteBoardTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getWhiteboardContentView(whiteboardMessage: CometChat.CustomMessage, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    launchCollaborativeWhiteboardDocument(whiteboardURL: string): void;
    getWhiteboardDocument(message: CometChat.CustomMessage): any;
    getAttachmentOptions(theme: CometChatTheme, id: any): CometChatMessageComposerAction[];
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
}
