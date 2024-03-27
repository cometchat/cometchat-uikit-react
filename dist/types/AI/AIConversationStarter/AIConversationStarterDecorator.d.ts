import { CometChatTheme } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { AIConversationStarterConfiguration } from "@cometchat/uikit-shared";
export declare class AIConversationStarterDecorator extends DataSourceDecorator {
    configuration?: AIConversationStarterConfiguration;
    newDataSource: DataSource;
    currentMessage: CometChat.BaseMessage | null;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: AIConversationStarterConfiguration);
    getId(): string;
    editReply(reply: string): void;
    closeIfMessageReceived(message: CometChat.BaseMessage): void;
    getConversationStarter: (theme?: CometChatTheme) => Promise<string[]>;
    private loadConversationStarter;
    private addMessageListener;
}
