import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, DateStyle, ReceiptStyle } from "my-cstom-package-lit";
import { CometChatTheme, CometChatUIKitConstants, fontHelper, MessageListAlignment } from "uikit-resources-lerna";
import { MessageListStyle, StickersConstants } from "uikit-utils-lerna";
import {CSSProperties} from 'react';

export const MessageListUnreadLabelStyle = () => {
    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
    } as CSSProperties
}

export const MessageListHeaderStyle = () => {
    return {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        height: 'auto'
    } as CSSProperties
}

export const MessageListFooterStyle = () => {
    return {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        height: 'auto'
    } as CSSProperties
}

export const MessageListDivStyle = () => {
    return {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        boxSizing: 'border-box',
    } as CSSProperties
}

export const MessageListWrapperStyle = (messageListStyle: MessageListStyle | undefined) => {
    return {
        height: '100%',
        width: '100%',
        flex: '1 1 0',
        order: '2',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        ...messageListStyle
    } as CSSProperties
}

export const MessageThreadViewStyle = (message: CometChat.BaseMessage, theme: CometChatTheme, loggedInUser: any) => {
    if ((!message.getSender() || message.getSender().getUid() === loggedInUser?.getUid()) && message?.getType() === CometChatUIKitConstants.MessageTypes.text) {
        return {
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            padding: "2px 8px 0 8px",
            buttonIconTint: theme.palette.getAccent600(),
            display: "flex",
            flexFlow: "row-reverse",
            alignItems: "flex-start",
            justifyContent: "space-between",
            buttonTextColor: theme.palette.getAccent("dark")
        }
    } else {
        return {
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            padding: "2px 8px 0 8px",
            buttonIconTint: "grey",
            display: "flex",
            flexFlow: "row-reverse",
            alignItems: "flex-start",
            justifyContent: "space-between",
            buttonTextColor: theme.palette.getPrimary()
        }
    }
}

export const dividerStyle = (theme : CometChatTheme) => {
    return {
        height: "1px",
        width: "100%",
        background: theme.palette.getAccent100()
    }
}

export const unreadMessageStyle = () => {
    return {
        height: "100%",
        width: "100%",
        background: "#3399FF",
        display: "flex",
        justifyContent: "center",
        buttonTextFont: "400 13px Inter",
        color: "white",
        border: "none",
        borderRadius: "12px"
    }
}

export const MessageListMessageIndicatorStyle = () => {
    return {
        height: "25px",
        width: "150px"
    }
}

export const MessageBubbleStyle = (message: CometChat.BaseMessage, theme: CometChatTheme, alignment: MessageListAlignment | undefined, loggedInUser: any) => {
    if (message.getDeletedAt()) {
        return {
            background: "transparent",
            border: `1px dashed ${theme.palette.getAccent400()}`,
            borderRadius: "12px",
        }
    } 
    else if (message?.getType() === CometChatUIKitConstants.calls.meeting && (!message?.getSender() || message?.getSender().getUid() == loggedInUser.getUid())) {
        return {
            background: theme.palette.getPrimary(),
            border: `none`,
            borderRadius: "12px",
        }
    } else if (message?.getType() === StickersConstants.sticker) {
        return {
            background: "transparent",
            borderRadius: "12px",
        }
    }
    else if (!message.getDeletedAt() && message.getCategory() === CometChatUIKitConstants.MessageCategory.message && message.getType() === CometChatUIKitConstants.MessageTypes.text && (!message.getSender() || loggedInUser?.uid === message.getSender().getUid())) {
        return {
            background: alignment === MessageListAlignment.left ? theme.palette.getAccent100() : theme.palette.getPrimary(),
            borderRadius: "12px",
        }
    } else if (!message.getDeletedAt() && message.getCategory() === CometChatUIKitConstants.MessageCategory.message && message.getType() === CometChatUIKitConstants.MessageTypes.audio) {
        return {
            borderRadius: "",
            background: theme.palette.getAccent100(),
        }
    } else if (message.getType() === CometChatUIKitConstants.MessageTypes.groupMember || message.getCategory() === CometChatUIKitConstants.MessageCategory.call) {
        return {
            background: "transparent",
            borderRadius: "12px",
            border: `1px solid ${theme.palette.getAccent100()}`
        }
    } else {
        if (message.getSender() && message.getSender().getUid() !== loggedInUser?.uid) {
            return {
                background: theme.palette.getAccent100(),
                borderRadius: "12px",
            }
        } else {
            return {
                background: theme.palette.getAccent100(),
                borderRadius: "12px",
            }
        }
    }
}

export const MessageReceiptStyle = (theme: CometChatTheme) => {
    return new ReceiptStyle({
        waitIconTint: theme.palette.getAccent700(),
        sentIconTint: theme.palette.getAccent600(),
        deliveredIconTint: theme.palette.getAccent600(),
        readIconTint: theme.palette.getPrimary(),
        errorIconTint: theme.palette.getError(),
    });
}

export const MessageBubbleDateStyle = (messageListStyle : MessageListStyle | undefined, theme : CometChatTheme) => {
    return {
        textColor: messageListStyle?.TimestampTextColor || theme.palette.getAccent600(),
        textFont: messageListStyle?.TimestampTextFont || fontHelper(theme.typography.caption2)
    }
}

export const MessageLabelStyle = {
    textFont: "400 11px Inter",
    textColor: "grey"
}

export const MessageDateStyle = (dateSeparatorStyle: DateStyle | undefined, theme: CometChatTheme) => {
    let tempDateSeparatorStyle: DateStyle | undefined = dateSeparatorStyle;
    let defaultDateStyle = new DateStyle({
        textFont: fontHelper(theme.typography.subtitle1),
        textColor: theme.palette.getAccent600(),
        background: theme.palette.getAccent100(),
        height: "100%",
        width: "100%",
        border: `1px solid ${theme.palette.getAccent100()}`,
        borderRadius: "8px",
    })

    tempDateSeparatorStyle = {...defaultDateStyle, ...tempDateSeparatorStyle};

    tempDateSeparatorStyle.background =  tempDateSeparatorStyle.background  ||  theme.palette.getAccent600()

    return tempDateSeparatorStyle;
}

export const TempMessageListStyle = (theme: CometChatTheme) => {
    return new MessageListStyle({
        background: theme.palette.getBackground(),
        border: `none`,
        emptyStateTextFont: fontHelper(theme.typography.title1),
        emptyStateTextColor: theme.palette.getAccent600(),
        errorStateTextFont: fontHelper(theme.typography.title1),
        errorStateTextColor: theme.palette.getAccent600(),
        loadingIconTint: theme.palette.getAccent600(),
        nameTextFont: fontHelper(theme.typography.title2),
        nameTextColor: theme.palette.getAccent600(),
        threadReplySeparatorColor: theme.palette.getAccent400(),
        threadReplyTextFont: fontHelper(theme.typography.subtitle1),
        threadReplyIconTint: theme.palette.getAccent600(),
        threadReplyTextColor: theme.palette.getAccent600(),
        TimestampTextFont: fontHelper(theme.typography.caption2),
        TimestampTextColor: theme.palette.getAccent600(),
    });
}

export const EmptyViewStyle = (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    let tempMessageListStyle = { ...TempMessageListStyle(theme), ...messageListStyle }
    return {
        textFont: tempMessageListStyle.emptyStateTextFont,
        textColor: tempMessageListStyle.emptyStateTextColor,
    }
}

export const LoadingViewStyle = (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    let tempMessageListStyle = { ...TempMessageListStyle(theme), ...messageListStyle }
    return {
        iconTint: tempMessageListStyle.loadingIconTint,
    }
}

export const ErrorViewStyle = (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => {
    let tempMessageListStyle = { ...TempMessageListStyle(theme), ...messageListStyle }
    return {
        textFont: tempMessageListStyle.errorStateTextFont,
        textColor: tempMessageListStyle.errorStateTextColor,
    }
}

export const MessageAvatarStyle = (avatarStyle: AvatarStyle | undefined, theme: CometChatTheme) => {
    let defaultAvatarStyle = new AvatarStyle({
        borderRadius: "24px",
        width: "28px",
        height: "28px",
        border: "none",
        backgroundColor: theme.palette.getAccent700(),
        nameTextColor: theme.palette.getAccent900(),
        backgroundSize: "cover",
        nameTextFont: fontHelper(theme.typography.subtitle1),
        outerViewBorder: "",
        outerViewBorderSpacing: "",
    });
    return { ...defaultAvatarStyle, ...avatarStyle };
}

export const defaultWrapperMessageBubbleStyle = {
    height: "100%",
    width: "100%",
    border: "",
    borderRadius: "",
    background: "",
}

export const defaultAvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px"
}

export const defaultDateSeparatorStyle = {
    textFont: "500 16px Inter",
    textColor: "rgba(20, 20, 20, 0.58)",
    background: "",
    height: "",
    width: "",
    border: "1px solid grey",
    borderRadius: "8px",
}

export const defaultMessageListStyle = {
    nameTextFont: "600 15px Inter",
    nameTextColor: "white",
    TimestampTextFont: "",
    TimestampTextColor: "",
    threadReplySeparatorColor: "",
    threadReplyTextFont: "",
    threadReplyIconTint: "",
    threadReplyTextColor: "",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "#bcbcbc",
    errorStateTextFont: "700 22px Inter",
    errorStateTextColor: "#bcbcbc",
    loadingIconTint: "grey",
}
