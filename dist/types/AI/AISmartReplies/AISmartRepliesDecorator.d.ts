import React from "react";
import { CometChatTheme, CometChatMessageComposerAction, CometChatActionsView } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CometChatButton } from "../../Shared/Views/CometChatButton";
import { AIOptionsStyle, AISmartRepliesConfiguration } from "@cometchat/uikit-shared";
export declare class AISmartRepliesDecorator extends DataSourceDecorator {
    configuration?: AISmartRepliesConfiguration;
    newDataSource: DataSource;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    theme: CometChatTheme;
    buttonRef: any;
    isModalClosed: boolean;
    private closeCallback?;
    constructor(dataSource: DataSource, configuration?: AISmartRepliesConfiguration);
    childRefCallback: (childRef: React.RefObject<typeof CometChatButton>) => void;
    getId(): string;
    editReply(reply: string): void;
    closeIfMessageReceived(message: CometChat.BaseMessage): void;
    getSmartReplies: (theme?: CometChatTheme) => Promise<string[]>;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, aiOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    private addMessageListener;
}
