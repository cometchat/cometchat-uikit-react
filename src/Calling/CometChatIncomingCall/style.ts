import {CSSProperties} from 'react';
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { fontHelper, CometChatTheme } from "uikit-resources-lerna";
import { CallscreenStyle, IncomingCallStyle } from "uikit-utils-lerna";

export const IncomingCallWrapperStyle = (incomingCallStyle : IncomingCallStyle) => {
    return {
        height: incomingCallStyle?.height,
        width: incomingCallStyle?.width,
        background: incomingCallStyle?.background,
        border: incomingCallStyle?.border,
        borderRadius: incomingCallStyle?.borderRadius,
        padding: "8px",
        position: "absolute",
        left: "8px",
        top: "8px",
        minHeight: "95px",
        minWidth: "230px",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "8px",
        alignItems: "flex-start"
    } as CSSProperties
}

export const IncomingCallSubtitleStyle = { display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "6px" }

export const IncomingCallLabelStyle = (incomingCallStyle : IncomingCallStyle) => {
    return {
        textFont: incomingCallStyle?.subtitleTextFont,
        textColor: incomingCallStyle?.subtitleTextColor
    }
}

export const IncomingCallListItemStyle = { 
    width: "100%", 
    marginLeft: "-4px" 
}

export const IncomingCallTailViewStyle = { 
    position: 'relative'
} as CSSProperties

export const IncomingCallButtonsStyle = { 
    display: 'flex', 
    gap: '8px', 
    paddingLeft: '8px', 
    paddingRight: '8px'
}

export const buttonStyle = {
    height:"100%",
    width:"100%",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center",
    padding:"8px 28px"
}

export const defaultAvatarStyle = (theme: CometChatTheme): AvatarStyle => {
    return new AvatarStyle({
        borderRadius: "16px",
        width: "38px",
        height: "38px",
        border: "none",
        backgroundColor: theme.palette.getAccent700(),
        nameTextColor: theme.palette.getAccent900(),
        backgroundSize: "cover",
        nameTextFont: fontHelper(theme.typography.subtitle1),
        outerViewBorder: "",
        outerViewBorderSpacing: "",
    });
}

export const defaultIncomingCallStyle = (theme: CometChatTheme): IncomingCallStyle => {
    return new IncomingCallStyle({
        width: "fit-content",
        height: "fit-content",
        background: theme.palette.getAccent800(),
        border: "none",
        borderRadius: "8px",
        titleTextFont: fontHelper(theme.typography.title2),
        titleTextColor: theme.palette.getAccent("dark"),
        subtitleTextFont: fontHelper(theme.typography.subtitle2),
        subtitleTextColor: theme.palette.getAccent("dark"),
        acceptButtonTextFont: fontHelper(theme.typography.text2),
        acceptButtonTextColor: theme.palette.getAccent("dark"),
        acceptButtonBackground: theme.palette.getPrimary(),
        acceptButtonBorderRadius: "8px",
        acceptButtonBorder: "none",
        declineButtonTextFont: fontHelper(theme.typography.text2),
        declineButtonTextColor: theme.palette.getAccent("dark"),
        declineButtonBackground: theme.palette.getError(),
        declineButtonBorderRadius: "8px",
        declineButtonBorder: "none",
    });
}

export const defaultListItemStyle = (incomingCallStyle : IncomingCallStyle, theme: CometChatTheme): ListItemStyle => {
    return new ListItemStyle({
        height: "100%",
        width: "100%",
        background: "transparent",
        activeBackground: "transparent",
        borderRadius: "0",
        titleFont: incomingCallStyle?.titleTextFont,
        titleColor: incomingCallStyle?.titleTextColor,
        border: "none",
        separatorColor: theme.palette.getAccent200(),
        hoverBackground: "transparent"
    });
}

export const AcceptButtonStyle = (incomingCallStyle : IncomingCallStyle) => {
    return {
        border: incomingCallStyle?.acceptButtonBorder,
        borderRadius: incomingCallStyle?.acceptButtonBorderRadius,
        background: incomingCallStyle?.acceptButtonBackground,
        buttonTextFont: incomingCallStyle?.acceptButtonTextFont,
        buttonTextColor: incomingCallStyle?.acceptButtonTextColor,
        ...buttonStyle
    };
}

export const DeclineButtonStyle = (incomingCallStyle : IncomingCallStyle) => {
    return {
        border: incomingCallStyle?.declineButtonBorder,
        borderRadius: incomingCallStyle?.declineButtonBorderRadius,
        background: incomingCallStyle?.declineButtonBackground,
        buttonTextFont: incomingCallStyle?.declineButtonTextFont,
        buttonTextColor: incomingCallStyle?.declineButtonTextColor,
        ...buttonStyle
    }
}

export const defaultOngoingCallStyle = (theme: CometChatTheme) => {
    return new CallscreenStyle({
        maxHeight: "100%",
        maxWidth: "100%",
        border: "none",
        borderRadius: "0",
        background: "#1c2226",
        minHeight: "400px",
        minWidth: "400px",
        minimizeIconTint: theme.palette.getAccent900(),
        maximizeIconTint: theme.palette.getAccent900(),
    });
}

export const IconStyle = (incomingCallStyle : IncomingCallStyle) => {
    return {
        height: "16px",
        width: "16px",
        iconTint: incomingCallStyle?.subtitleTextColor || "RGBA(20, 20, 20, 0.68)"
    }
}