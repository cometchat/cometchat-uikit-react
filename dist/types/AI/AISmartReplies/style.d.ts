/// <reference types="react" />
import { AISmartRepliesStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare const getContainerStyle: (style?: AISmartRepliesStyle, theme?: CometChatTheme) => {
    display: string;
    overflow: string;
    width: string;
    height: string;
    justifyContent: string;
    alignItems: string;
    minHeight: string;
    background: string | undefined;
    borderRadius: string;
};
export declare const contentContainerStyle: React.CSSProperties;
export declare const getSmartReplyStyle: (theme?: CometChatTheme, style?: AISmartRepliesStyle) => {
    replyTextFont: string;
    replyTextColor: string | undefined;
    replyBackground: string;
    boxShadow: string;
    background: string;
    border: string;
    borderRadius: string;
    display: string;
    justifyContent: string;
};
export declare function getBackButtonStyle(style?: AISmartRepliesStyle, theme?: CometChatTheme): any;
export declare function getSmartRepliesContainerStyle(): any;
export declare function getSmartRepliesTitleStyle(style?: AISmartRepliesStyle, theme?: CometChatTheme): any;
