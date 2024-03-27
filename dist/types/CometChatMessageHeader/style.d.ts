import { CometChat } from "@cometchat/chat-sdk-javascript";
import { ListItemStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { MessageHeaderStyle } from "@cometchat/uikit-shared";
import React from 'react';
export declare const getMessageHeaderWrapperStyle: (messageHeaderStyle: MessageHeaderStyle, theme: CometChatTheme) => React.CSSProperties;
export declare const MessageHeaderDivStyle: () => React.CSSProperties;
export declare const MessageHeaderBackButtonStyle: () => {
    width: string;
    height: string;
    display: string;
    alignItems: string;
    justifyContent: string;
};
export declare const MessageHeaderListItemStyle: () => {
    height: string;
    width: string;
    display: string;
    alignItems: string;
    justifyContent: string;
};
export declare const MessageHeaderMenuStyle: () => {
    width: string;
    display: string;
    alignItems: string;
    justifyContent: string;
};
export declare const CometChatListItemStyle: () => {
    width: string;
};
export declare const subtitleStyle: (user: CometChat.User | undefined, isTypingRef: React.MutableRefObject<boolean>, messageHeaderStyle: MessageHeaderStyle, theme: CometChatTheme) => {
    textFont: string;
    textColor: string | undefined;
};
export declare const defaultAvatarStyle: (theme: CometChatTheme) => {
    borderRadius: string;
    width: string;
    height: string;
    border: string;
    backgroundColor: string | undefined;
    nameTextColor: string | undefined;
    backgroundSize: string;
    nameTextFont: string;
    outerViewBorder: string;
    outerViewBorderSpacing: string;
};
export declare const defaultStatusIndicatorStyle: () => {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
};
export declare const defaultListItemStyle: (listItemStyle: ListItemStyle, theme: CometChatTheme) => ListItemStyle;
export declare const getBackButtonStyle: (theme: CometChatTheme) => {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
