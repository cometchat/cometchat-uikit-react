import { CometChatTheme } from "@cometchat/uikit-resources";
import React from "react";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { SmartRepliesConfiguration } from "./SmartRepliesConfiguration";
export declare class SmartReplyExtensionDecorator extends DataSourceDecorator {
    configuration?: SmartRepliesConfiguration;
    theme?: CometChatTheme;
    private LISTENER_ID;
    private activeUser;
    private activeGroup;
    currentMessage: CometChat.BaseMessage | null;
    loggedInUser: CometChat.User | null;
    constructor(dataSource: DataSource, configuration?: SmartRepliesConfiguration, theme?: CometChatTheme);
    private addMessageListener;
    getReplies(message: CometChat.TextMessage): any[] | null;
    getSmartReplyStyle(): {
        replyTextFont: string;
        replyTextColor: string | undefined;
        replyBackground: string;
        boxShadow: string;
        closeIconTint: string | undefined;
        background: string;
        width: string;
        height: string;
        border: string;
        display: string;
        justifyContent: string;
    };
    sendSmartReply(_event: any): void;
    closeSmartReply(): void;
    getSmartReplyButtonStyle(): React.CSSProperties;
    getSmartReplyView(message: CometChat.TextMessage): import("react/jsx-runtime").JSX.Element | null;
    getId(): string;
}
