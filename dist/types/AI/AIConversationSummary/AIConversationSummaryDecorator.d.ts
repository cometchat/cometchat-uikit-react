import { CometChatTheme, CometChatMessageComposerAction, CometChatActionsView } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { AIConversationSummaryConfiguration, AIOptionsStyle } from "@cometchat/uikit-shared";
export declare class AIConversationSummaryDecorator extends DataSourceDecorator {
    configuration?: AIConversationSummaryConfiguration;
    newDataSource: DataSource;
    currentMessage: CometChat.BaseMessage | null;
    unreadMessageCount: number;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    theme: CometChatTheme;
    private LISTENER_ID;
    constructor(dataSource: DataSource, configuration?: AIConversationSummaryConfiguration);
    getId(): string;
    closePanel: () => void;
    getConversationSummary: (theme?: CometChatTheme) => Promise<string>;
    private loadConversationSummary;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, aiOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    private addMessageListener;
}
