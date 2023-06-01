import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { ListStyle } from "uikit-utils-lerna";

export function listStyle(theme : CometChatTheme) : ListStyle {
    return {
        background: theme.palette.getBackground(),
        titleTextFont: fontHelper(theme.typography.heading),
        titleTextColor: theme.palette.getAccent()
    };
}
