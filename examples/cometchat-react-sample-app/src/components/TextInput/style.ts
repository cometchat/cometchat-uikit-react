import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function labelStyle() : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px"
    };
}

export function labelTextStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getAccent600("light")
    };
}

export function inputStyle(theme : CometChatTheme) : CSSProperties {
    return {
        padding: "8px",
        border: `1px solid ${theme.palette.getAccent100("light")}`,
        borderRadius: "8px",
        font: fontHelper(theme.typography.subtitle2)
    };
}

export function requiredSymbolStyle() : CSSProperties {
    return {
        color: "red"
    };
}

export function labelContainerStyle() : CSSProperties {
    return {
        display: "flex",
        columnGap: "1px"
    }
}
