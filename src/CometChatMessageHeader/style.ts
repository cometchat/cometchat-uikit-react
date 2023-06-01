import { CometChat } from "@cometchat-pro/chat"
import { CometChatTheme, CometChatUIKitConstants, fontHelper } from "uikit-resources-lerna"
import { MessageHeaderStyle } from "uikit-utils-lerna"
import React, {CSSProperties} from 'react';

export const MessageHeaderWrapperStyle = (messageHeaderStyle: MessageHeaderStyle) => {
    return {
        width: messageHeaderStyle?.width,
        height: messageHeaderStyle?.height,
        border: messageHeaderStyle?.border,
        borderRadius: messageHeaderStyle?.borderRadius,
        background: messageHeaderStyle?.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        padding: '8px',
        boxSizing: 'border-box'
    } as CSSProperties
}

export const MessageHeaderDivStyle = () => {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
        width: '100%'
    }
}

export const MessageHeaderBackButtonStyle = () => {
    return {
        marginRight: '8px'
    }
}

export const MessageHeaderListItemStyle = () => {
    return {
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
    }
}

export const MessageHeaderMenuStyle = () => {
    return {
        width: 'fit-content',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '12px',
        columnGap: '16px'
    }
}

export const CometChatListItemStyle = () => {
    return {
        width: '100%'
    }
}

export const subtitleStyle = (user : CometChat.User | undefined, isTypingRef : React.MutableRefObject<boolean>, getMessageHeaderStyle : MessageHeaderStyle, theme : CometChatTheme) => {
    if (user && user.getStatus() === CometChatUIKitConstants.userStatusType.online) {
        return {
            textFont: getMessageHeaderStyle?.subtitleTextFont,
            textColor: getMessageHeaderStyle?.onlineStatusColor ? getMessageHeaderStyle?.onlineStatusColor : theme.palette.getPrimary()
        }
    } else {
        return {
            textFont: isTypingRef?.current ? getMessageHeaderStyle?.typingIndicatorTextFont : getMessageHeaderStyle?.subtitleTextFont,
            textColor: isTypingRef?.current ? getMessageHeaderStyle?.typingIndicatorTextColor : getMessageHeaderStyle?.subtitleTextColor
        }
    }
}

export const defaultAvatarStyle = (theme : CometChatTheme) => {
    return {
        borderRadius: "24px",
        width: "36px",
        height: "36px",
        border: "none",
        backgroundColor: theme.palette.getAccent700(),
        nameTextColor: theme.palette.getAccent900(),
        backgroundSize: "cover",
        nameTextFont: fontHelper(theme.typography.subtitle1),
        outerViewBorder: "",
        outerViewBorderSpacing: ""
    }
}

export const defaultStatusIndicatorStyle = () => {
    return {
        height: "12px",
        width: "12px",
        border: "none",
        borderRadius: "24px"
    }
}

export const defaultMessageHeaderStyle = (theme : CometChatTheme) => {
    return {
        background: theme.palette.getBackground(),
        border: `none`,
        onlineStatusColor: theme.palette.getPrimary(),
        privateGroupIconBackground: theme.palette.getSuccess(),
        passwordGroupIconBackground: "RGB(247, 165, 0)",
        backButtonIconTint: theme.palette.getPrimary(),
        subtitleTextColor: theme.palette.getAccent600(),
        subtitleTextFont: fontHelper(theme.typography.subtitle2),
        typingIndicatorTextColor: theme.palette.getPrimary(),
        typingIndicatorTextFont: fontHelper(theme.typography.subtitle1)
    }
}

export const defaultListItemStyle = (theme : CometChatTheme) => {
    return {
        height: "45px",
        width: "100%",
        background: theme.palette.getBackground(),
        activeBackground: "transparent",
        borderRadius: "0",
        titleFont: fontHelper(theme.typography.title2),
        titleColor: theme.palette.getAccent(),
        border: "none",
        separatorColor: "",
        hoverBackground: "transparent"
    }
}

export const defaultBackButtonStyle = () => {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "none",
        background: "transparent",
        buttonIconTint: "#3399FF"
    }
}
