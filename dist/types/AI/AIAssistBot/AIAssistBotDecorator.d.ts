import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatActionsView, CometChatMessageComposerAction, CometChatTheme } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { AIAssistBotConfiguration, AIOptionsStyle } from "@cometchat/uikit-shared";
export declare class AIAssistBotDecorator extends DataSourceDecorator {
    configuration?: AIAssistBotConfiguration;
    newDataSource: DataSource;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    bots: CometChat.User[] | [];
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: AIAssistBotConfiguration);
    getId(): string;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, aiOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    onMessageSent: (message: string, bot: CometChat.User) => Promise<string>;
    closeChat: () => void;
    onOptionClick: (bot: CometChat.User) => void;
    private getAllBots;
    private addMessageListener;
}
