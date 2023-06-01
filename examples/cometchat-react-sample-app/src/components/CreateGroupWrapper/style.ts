import { CreateGroupStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function createGroupStyle(isMobileView : boolean, theme : CometChatTheme) : CreateGroupStyle {
    return {
        boxShadow: `${theme.palette.getAccent100()} 4px 16px 32px 4px`,
        groupTypeTextFont: fontHelper(theme.typography.subtitle2),
        groupTypeBorder: `1px solid ${theme.palette.getAccent600()}`,
        groupTypeBorderRadius: "0",
        groupTypeTextColor: theme.palette.getAccent(),
        groupTypeTextBackground: "transparent",
        groupTypeBackground: theme.palette.getAccent100(),
        activeGroupTypeTextFont: fontHelper(theme.typography.subtitle2),
        activeGroupTypeTextColor: theme.palette.getAccent(),
        activeGroupTypeBackground: theme.palette.getAccent900(),
        activeGroupTypeBoxShadow: `${theme.palette.getAccent200()} 0 3px 8px 0`,
        activeGroupTypeBorderRadius: "8px",
        activeGroupTypeBorder: "none",
        groupTypeTextBoxShadow: "none",
        groupTypeTextBorderRadius: "0",
        closeIconTint: theme.palette.getPrimary(),
        titleTextFont: fontHelper(theme.typography.title1),
        titleTextColor: theme.palette.getAccent(),
        errorTextFont: fontHelper(theme.typography.subtitle1),
        errorTextBackground: theme.palette.getError(),
        errorTextBorderRadius: "8px",
        errorTextBorder: "none",
        errorTextColor: theme.palette.getError(),
        nameInputPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
        nameInputPlaceholderTextColor: theme.palette.getAccent600(),
        nameInputBackground: theme.palette.getAccent100(),
        nameInputTextFont: fontHelper(theme.typography.subtitle1),
        nameInputTextColor: theme.palette.getAccent(),
        nameInputBorder: "none",
        nameInputBorderRadius: "8px",
        nameInputBoxShadow: `${theme.palette.getAccent100()} 0 0 0 1px`,
        passwordInputPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
        passwordInputPlaceholderTextColor: theme.palette.getAccent600(),
        passwordInputBackground: theme.palette.getAccent100(),
        passwordInputBorder: "none",
        passwordInputBorderRadius: "8px",
        passwordInputBoxShadow: `${theme.palette.getAccent100()} 0 0 0 1px`,
        passwordInputTextFont: fontHelper(theme.typography.subtitle1),
        passwordInputTextColor: theme.palette.getAccent(),
        createGroupButtonTextFont: fontHelper(theme.typography.text2),
        createGroupButtonTextColor: theme.palette.getAccent900(),
        createGroupButtonBackground: theme.palette.getPrimary(),
        createGroupButtonBorderRadius: "8px",
        createGroupButtonBorder: "none",
        height: "620px",
        width: isMobileView ? "290px" : "360px",
        borderRadius: "8px",
        background: theme.palette.getBackground(),
        border: `3px solid ${theme.palette.getAccent200()}`
    };
}

export function createGroupWrapperStyle(theme : CometChatTheme) : CSSProperties {
    return {
        background: theme.palette.getBackground(),
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    };
}
