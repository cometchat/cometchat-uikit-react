/// <reference types="react" />
import { CometChatTheme } from "@cometchat/uikit-resources";
import { AIConversationStarterStyle } from "@cometchat/uikit-shared";
export declare const getContainerStyle: (style?: AIConversationStarterStyle) => {
    display: string;
    overflow: string;
    width: string;
    height: string;
    justifyContent: string;
    alignItems: string;
    minHeight: string;
};
export declare const contentContainerStyle: React.CSSProperties;
export declare const getConversationStarterStyle: (theme?: CometChatTheme, style?: AIConversationStarterStyle) => {
    replyTextFont: string;
    replyTextColor: string | undefined;
    replyBackground: string;
    boxShadow: string;
    background: string;
    width: string;
    height: string;
    border: string;
    borderRadius: string;
    display: string;
    justifyContent: string;
};
