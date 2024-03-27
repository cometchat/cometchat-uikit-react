import { CometChatTheme, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { CSSProperties } from "react";
export declare const MessageBubbleWrapperStyles: (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any) => CSSProperties;
export declare const MessageBubbleAvatarStyles: () => CSSProperties;
export declare const MessageBubbleAlignmentStyles: (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any) => CSSProperties;
export declare const MessageBubbleTitleStyles: (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any) => {
    display: string;
    justifyContent: string;
    alignItems: string;
};
export declare const MessageOptionsStyles: (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any, headerView: any, theme: CometChatTheme) => CSSProperties;
export declare const menuListStyles: (theme: CometChatTheme) => {
    border: string;
    borderRadius: string;
    background: string | undefined;
    submenuWidth: string;
    submenuHeight: string;
    submenuBorder: string;
    submenuBorderRadius: string;
    submenuBackground: string | undefined;
    moreIconTint: string | undefined;
};
