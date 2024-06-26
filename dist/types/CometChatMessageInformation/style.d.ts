import { CometChatTheme } from "@cometchat/uikit-resources";
import { CSSProperties } from "react";
import { ReceiptStyle, DateStyle } from "@cometchat/uikit-elements";
import { MessageInformationStyle } from "@cometchat/uikit-shared";
type ButtonStyle = CSSProperties & {
    buttonIconTint?: string;
};
type WrapperStyle = CSSProperties & {
    position?: string;
};
export declare function closeBtnStyle(theme: CometChatTheme): ButtonStyle;
export declare const dividerStyle: (theme: CometChatTheme) => {
    height: string;
    width: string;
    background: string | undefined;
};
export declare function receiptStyle(theme: CometChatTheme): ReceiptStyle;
export declare const MessageDateStyle: (dateSeparatorStyle: DateStyle | undefined, theme: CometChatTheme) => DateStyle;
export declare const defaultDateSeparatorStyle: {
    background: string;
    height: string;
    width: string;
    border: string;
    borderRadius: string;
};
export declare const dateInfoStyle: {
    marginLeft: string;
};
export declare const receiptWrapperStyle: {
    display: string;
};
export declare const receiptSubtitleWrapperStyle: {
    width: string;
};
export declare const messageInfoStyle: (theme: CometChatTheme) => {
    width: string;
    height: string;
    margin: string;
    background: string | undefined;
    borderRadius: string;
};
export declare const messageInfoHeaderStyle: (theme: CometChatTheme) => WrapperStyle;
export declare const getMessageInfoStyle: (theme: CometChatTheme, messageInfo?: MessageInformationStyle) => CSSProperties;
export declare const getReceiptTextStyle: (theme: CometChatTheme) => CSSProperties;
export declare const getMessageTextStyle: (theme: CometChatTheme) => CSSProperties;
export declare const getParentBubbleStyle: (alignBubble?: boolean) => CSSProperties;
export {};
