import { CometChatMessageTemplate, CometChatTheme, CometChatMessageComposerAction } from "@cometchat/uikit-resources";
import { CreatePollStyle } from "@cometchat/uikit-shared";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { DataSource } from "../../Shared/Framework/DataSource";
import { PollsConfiguration } from "./PollsConfiguration";
export declare class PollsExtensionDecorator extends DataSourceDecorator {
    theme: CometChatTheme;
    private loggedInUser;
    configuration?: PollsConfiguration;
    newDataSource: DataSource;
    constructor(dataSource: DataSource, configuration?: PollsConfiguration);
    getLoggedInUser(): Promise<void>;
    getId(): string;
    getAllMessageTypes(): string[];
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(_theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getPollsTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getPollsContentView(message: CometChat.CustomMessage, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    getPollBubbleData(message: CometChat.CustomMessage, key?: string): any;
    getAttachmentOptions(theme: CometChatTheme, id?: any): CometChatMessageComposerAction[];
    onPollsButtonClicked(theme: CometChatTheme, ...args: any[]): void;
    getPollView(user: CometChat.User, group: CometChat.Group, createPollStyle: CreatePollStyle): import("react/jsx-runtime").JSX.Element;
    triggerCloseEvent(): void;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
}
