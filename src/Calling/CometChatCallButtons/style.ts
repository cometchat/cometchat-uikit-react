import { CallButtonsStyle, OutgoingCallStyle, CallscreenStyle } from "uikit-utils-lerna";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import {CSSProperties} from "react";

export const CallButtonsWrapperStyle = (callButtonStyle : CallButtonsStyle) => {
    return {
        height: callButtonStyle?.height,
        width: callButtonStyle?.width,
        background: callButtonStyle?.background,
        border: callButtonStyle?.border,
        borderRadius: callButtonStyle?.borderRadius
    }
}

export const outgoingCallStyle: OutgoingCallStyle = {
    width: "360px",
    height: "581px",
    titleTextFont: "700 22px Inter",
    titleTextColor: "RGB(20, 20, 20)",
    subtitleTextFont: "400 15px Inter",
    subtitleTextColor: "RGBA(20, 20, 20, 0.58)",
    borderRadius: "8px"
}

export const buttonStyle = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
}

export const defaultCallsButtonStyle = (theme: CometChatTheme) : CallButtonsStyle => { 
    return new CallButtonsStyle({
        width: "100%",
        height: "100%",
        background: "transparent",
        border: "none",
        borderRadius: "0",
        voiceCallIconTint: theme.palette.getPrimary(),
        videoCallIconTint: theme.palette.getPrimary(),
        voiceCallIconTextFont: fontHelper(theme.typography.caption1),
        videoCallIconTextFont: fontHelper(theme.typography.caption1),
        voiceCallIconTextColor: theme.palette.getPrimary(),
        videoCallIconTextColor: theme.palette.getPrimary(),
        buttonPadding: "8px 32px",
        buttonBackground: theme.palette.getAccent100(),
        buttonBorder: "0",
        buttonBorderRadius: "8px"
    })
}

export const ongoingCallStyle = (theme: CometChatTheme): CallscreenStyle => {
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

export const getVoiceCallButtonTint = (disableButtons : boolean, callButtonStyle : CallButtonsStyle | undefined, theme : CometChatTheme) => {
    return disableButtons ? theme.palette.getAccent600() : callButtonStyle?.voiceCallIconTint
}

export const getVideoCallButtonTint = (disableButtons : boolean, callButtonStyle : CallButtonsStyle | undefined, theme : CometChatTheme) => {
    return disableButtons ? theme.palette.getAccent600() : callButtonStyle?.videoCallIconTint
}

export const VideoCallButtonStyle = (callButtonStyle : CallButtonsStyle | undefined) => {
    return {
        buttonIconTint: callButtonStyle?.videoCallIconTint ?? "RGB(51, 153, 255)",
        buttonTextFont: callButtonStyle?.videoCallIconTextFont ?? "400 12px Inter",
        buttonTextColor: callButtonStyle?.videoCallIconTextColor ?? "RGB(51, 153, 255)",
        padding: callButtonStyle?.buttonPadding ?? "8px 32px",
        background:callButtonStyle?.buttonBackground ?? "transparent",
        border:callButtonStyle?.border ?? "none",
        borderRadius:callButtonStyle?.buttonBorderRadius ?? "0",
        ...buttonStyle
    } as CSSProperties
}

export const VoiceCallButtonStyle = (callButtonStyle : CallButtonsStyle | undefined) => {
    return {
        buttonIconTint: callButtonStyle?.voiceCallIconTint ?? "RGB(51, 153, 255)",
        buttonTextFont: callButtonStyle?.voiceCallIconTextFont ?? "400 12px Inter",
        buttonTextColor: callButtonStyle?.voiceCallIconTextColor ?? "RGB(51, 153, 255)",
        padding: callButtonStyle?.buttonPadding ?? "8px 32px",
        background: callButtonStyle?.buttonBackground ?? "transparent",
        border: callButtonStyle?.border ?? "none",
        borderRadius: callButtonStyle?.buttonBorderRadius ?? "0",
        ...buttonStyle
    } as CSSProperties
}