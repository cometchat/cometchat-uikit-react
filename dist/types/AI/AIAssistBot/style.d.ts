/// <reference types="react" />
import { AIAssistBotConfiguration, AIAssistBotStyle } from "@cometchat/uikit-shared";
import { ActionSheetStyle, AvatarStyle, MessageInputStyle, ReceiptStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare const getContainerStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getBotsContainerStyle: () => import("react").CSSProperties;
export declare const getBotTitleStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getBackButtonStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => {
    height: string;
    width: string;
    buttonIconTint: string;
    border: string;
    borderRadius: string;
    background: string;
    display: string;
    justifyContent: string;
};
export declare const getOptionsContainerStyle: () => import("react").CSSProperties;
export declare const getOptionStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => ActionSheetStyle;
export declare const getBotBackgroundStyle: (theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getBotChatContainerStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getBotChatHeaderStyle: (theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getAvatarStyle: (style: AvatarStyle) => AvatarStyle;
export declare const getBotHeaderTitleStyle: (style: AIAssistBotStyle | undefined, theme: CometChatTheme) => import("react").CSSProperties;
export declare const getBotHeaderSubtitleStyle: (style: AIAssistBotStyle | undefined, theme: CometChatTheme) => import("react").CSSProperties;
export declare const getCloseButtonStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getMessageBubbleStyle: (message: CometChat.TextMessage, theme: CometChatTheme, sender: CometChat.User, configuration: AIAssistBotConfiguration) => {
    background: string | undefined;
    borderRadius: string;
    border: string;
};
export declare const getMessageListFooterStyle: () => import("react").CSSProperties;
export declare const getMessageInputStyle: (style: MessageInputStyle, theme: CometChatTheme) => MessageInputStyle;
export declare const getSendButtonStyle: (style?: AIAssistBotStyle, theme?: CometChatTheme) => import("react").CSSProperties;
export declare const getMessageBubbleDateStyle: (theme: CometChatTheme) => import("react").CSSProperties;
export declare const getMessageReceiptStyle: (style: AIAssistBotStyle, theme: CometChatTheme) => ReceiptStyle;
export declare const getMessageBubbleContainerStyle: (message: CometChat.TextMessage, sender: CometChat.User) => import("react").CSSProperties;
