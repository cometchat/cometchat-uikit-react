import { AvatarStyle, DateStyle, LabelStyle, ListItemStyle, ReceiptStyle } from "@cometchat/uikit-elements";
import { CometChatTheme, MessageBubbleAlignment, MessageListAlignment } from "@cometchat/uikit-resources";
import { ListStyle, MessageListStyle, ReactionInfoConfiguration, ReactionInfoStyle, ReactionListStyle, ReactionsStyle } from "@cometchat/uikit-shared";
import { CSSProperties } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
export declare const MessageListUnreadLabelStyle: () => CSSProperties;
export declare const MessageListHeaderStyle: () => CSSProperties;
export declare const MessageListFooterStyle: () => CSSProperties;
export declare const MessageListDivStyle: () => CSSProperties;
export declare const MessageListWrapperStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => CSSProperties;
export declare const MessageThreadViewStyle: (message: CometChat.BaseMessage, theme: CometChatTheme, loggedInUser: any, messageListStyle?: MessageListStyle) => {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
    display: string;
    flexFlow: string;
    alignItems: string;
    buttonTextColor: string | undefined;
    buttonTextFont: string;
    iconHeight: string;
    iconWidth: string;
    gap: string;
};
export declare const dividerStyle: (theme: CometChatTheme) => {
    height: string;
    width: string;
    background: string | undefined;
};
export declare const unreadMessageStyle: (theme: CometChatTheme) => {
    height: string;
    width: string;
    background: string | undefined;
    display: string;
    justifyContent: string;
    buttonTextFont: string;
    buttonTextColor: string | undefined;
    border: string;
    borderRadius: string;
};
export declare const MessageListMessageIndicatorStyle: () => {
    height: string;
    width: string;
};
export declare const MessageBubbleStyle: (message: CometChat.BaseMessage, theme: CometChatTheme, alignment: MessageListAlignment | undefined, loggedInUser: any) => {
    background: string | undefined;
    border: string;
    borderRadius: string;
    width?: undefined;
} | {
    background: string | undefined;
    borderRadius: string;
    border?: undefined;
    width?: undefined;
} | {
    background: string | undefined;
    width: string;
    border?: undefined;
    borderRadius?: undefined;
};
export declare const MessageReceiptStyle: (theme: CometChatTheme, message: CometChat.BaseMessage) => ReceiptStyle;
export declare const getStatusInfoViewStyle: (isValid: boolean, theme: CometChatTheme, message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) => CSSProperties;
export declare const messageFooterViewStyle: (alignment: MessageBubbleAlignment) => CSSProperties;
export declare const MessageBubbleDateStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    textColor: string | undefined;
    textFont: string;
    padding: string;
    display: string;
};
export declare const MessageLabelStyle: (theme: CometChatTheme) => {
    textFont: string;
    textColor: string | undefined;
};
export declare const MessageDateStyle: (dateSeparatorStyle: DateStyle | undefined, theme: CometChatTheme) => DateStyle;
export declare const TempMessageListStyle: (theme: CometChatTheme) => MessageListStyle;
export declare const EmptyViewStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    textFont: string | undefined;
    textColor: string | undefined;
};
export declare const LoadingViewStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    iconTint: string | undefined;
};
export declare const ErrorViewStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    textFont: string | undefined;
    textColor: string | undefined;
};
export declare const MessageAvatarStyle: (avatarStyle: AvatarStyle | undefined, theme: CometChatTheme) => {
    borderRadius?: string | undefined;
    width?: string | undefined;
    height?: string | undefined;
    border?: string | undefined;
    nameTextColor?: string | undefined;
    backgroundSize?: string | undefined;
    nameTextFont?: string | undefined;
    outerViewBorderWidth?: string | undefined;
    outerViewBorderSpacing?: string | undefined;
    outerViewBorderRadius?: string | undefined;
    outerViewBorderColor?: string | undefined;
    backgroundColor?: string | undefined;
};
export declare const DateBubbleStyle: () => {
    display: string;
    justifyContent: string;
    width: string;
    marginBottom: string;
};
export declare const defaultWrapperMessageBubbleStyle: {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
};
export declare const defaultAvatarStyle: {
    borderRadius: string;
    width: string;
    height: string;
};
export declare const defaultDateSeparatorStyle: {
    textFont: string;
    textColor: string;
    background: string;
    height: string;
    width: string;
    border: string;
    borderRadius: string;
};
export declare const defaultMessageListStyle: {
    nameTextFont: string;
    nameTextColor: string;
    TimestampTextFont: string;
    TimestampTextColor: string;
    threadReplySeparatorColor: string;
    threadReplyTextFont: string;
    threadReplyIconTint: string;
    threadReplyTextColor: string;
    emptyStateTextFont: string;
    emptyStateTextColor: string;
    errorStateTextFont: string;
    errorStateTextColor: string;
    loadingIconTint: string;
};
export declare const bubbleStyle: (alignment: MessageBubbleAlignment) => CSSProperties;
export declare const defaultMessageListBubbleStyle: CSSProperties;
export declare const getListStyle: () => ListStyle;
export declare const getReactionListAvatarStyle: (theme: CometChatTheme) => AvatarStyle;
export declare const getReactionListItemStyle: (theme: CometChatTheme) => ListItemStyle;
export declare const getReactionListStyle: (theme: CometChatTheme) => ReactionListStyle;
export declare const getReactionInfoStyle: (theme: CometChatTheme, config: ReactionInfoConfiguration) => ReactionInfoStyle;
export declare const getReactionsStyle: (reactionsStyle: ReactionsStyle | undefined, theme: CometChatTheme) => ReactionsStyle;
export declare const getUnreadThreadRepliesCountStyle: (theme: CometChatTheme, messageListStyle?: MessageListStyle) => LabelStyle;
