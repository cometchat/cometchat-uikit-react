import { JoinGroupStyle } from "my-cstom-package-lit";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function joinGroupStyle(theme : CometChatTheme) : JoinGroupStyle {
    return {
        boxShadow: `${theme.palette.getAccent100()} 0px 16px 32px 0px`,
        titleTextFont: fontHelper(theme.typography.title1),
        titleTextColor: theme.palette.getAccent(),
        passwordInputPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
        passwordInputPlaceholderTextColor: theme.palette.getAccent600(),
        passwordInputBackground: theme.palette.getAccent100(),
        passwordInputBorder: "none",
        passwordInputBorderRadius: "8px",
        passwordInputBoxShadow: `${theme.palette.getAccent100()} 0 0 0 1px`,
        passwordInputTextFont: fontHelper(theme.typography.subtitle1),
        passwordInputTextColor: theme.palette.getAccent(),
        height: "100%",
        width: "100%",
        joinButtonTextFont: fontHelper(theme.typography.subtitle1),
        joinButtonTextColor: theme.palette.getAccent(),
        joinButtonBackground: theme.palette.getPrimary(),
        joinButtonBorderRadius: "8px",
        joinButtonBorder: "none",
        background: theme.palette.getBackground()
    };
}
