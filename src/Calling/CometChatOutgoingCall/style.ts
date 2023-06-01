import { AvatarStyle, CardStyle } from "my-cstom-package-lit";
import { OutgoingCallStyle } from "uikit-utils-lerna";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export const OutgoingCallWrapperStyle = (outgoingCallStyle : OutgoingCallStyle) => {
    return {
        height: outgoingCallStyle?.height,
        width: outgoingCallStyle?.width,
        background: outgoingCallStyle?.background,
        border: outgoingCallStyle?.border,
        borderRadius: outgoingCallStyle?.borderRadius
    }
}

export const OutgoingCallSubtitleStyle = (outgoingCallStyle : OutgoingCallStyle) => {
    return {
        textFont: outgoingCallStyle?.subtitleTextFont,
        textColor: outgoingCallStyle?.subtitleTextColor
    }
}

export const OutgoingCallCancelButtonStyle = (outgoingCallStyle : OutgoingCallStyle) => { 
    return {
        height: "fit-content",
        width: "fit-content",
        buttonTextFont: outgoingCallStyle?.declineButtonTextFont,
        buttonTextColor: outgoingCallStyle?.declineButtonTextColor,
        borderRadius: "8px",
        border: "none",
        buttonIconTint: outgoingCallStyle?.declineButtonIconTint,
        background: "",
        iconBackground: outgoingCallStyle?.declineButtonIconBackground
    }
}

export const buttonStyle = {
    height: "fit-content",
    width: "fit-content",
    buttonTextFont: "400 12px Inter",
    buttonTextColor: "RGBA(20, 20, 20, 0.58)",
    borderRadius: "8px",
    border: "none",
    buttonIconTint: "white",
    background: "",
    iconBackground: "red"
};

export const OutgoingCallCardStyle: CardStyle = {
    height: "100%",
    width: "100%",
    border: "inherite",
    borderRadius: "inherite",
    background: "transparent",
    titleFont: "700 22px Inter",
    titleColor: "black",
}

export const defaultAvatarStyle = (theme: CometChatTheme) : AvatarStyle => {
    return new AvatarStyle(
        {
            borderRadius: "50%",
            width: "180px",
            height: "180px",
            border: `1px solid  ${theme.palette.getAccent100()}`,
            backgroundColor: theme.palette.getAccent700(),
            nameTextColor: theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(theme.typography.subtitle1),
            outerViewBorder: "",
            outerViewBorderSpacing: "",
        }
    );
}

export const defaultOutgoingCallStyle = (theme: CometChatTheme): OutgoingCallStyle =>{
    return new OutgoingCallStyle(
        {
            width: "100%",
            height: "100%",
            background: theme.palette.getBackground(),
            border: "none",
            borderRadius: "0",
            titleTextFont: fontHelper(theme.typography.title1),
            titleTextColor: theme.palette.getAccent(),
            subtitleTextFont: fontHelper(theme.typography.subtitle1),
            subtitleTextColor: theme.palette.getAccent600(),
            declineButtonTextFont:fontHelper(theme.typography.caption1),
            declineButtonTextColor:theme.palette.getAccent600(),
            declineButtonIconTint:theme.palette.getAccent("dark"),
            declineButtonIconBackground:theme.palette.getError()
        }
    );
} 