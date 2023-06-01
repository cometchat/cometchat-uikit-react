import { IconStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function cardStyle(cardContainerStyle : CSSProperties | undefined, theme : CometChatTheme) : CSSProperties {
    return {
        padding: "16px",
        borderRadius: "8px",
        boxShadow: `0px 0px 8px ${theme.palette.getAccent300()}`,
        display: "flex",
        columnGap: "12px",
        border: `1px solid ${theme.palette.getAccent300()}`,
        backgroundColor: theme.palette.getBackground(),
        cursor: "pointer",
        ...cardContainerStyle
    };
}

export function iconStyle(theme : CometChatTheme) : IconStyle {
    return {
        width: "28px",
        height: "28px",
        iconTint: theme.palette.getAccent()
    };
}

export function titleStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.title2),
        color: theme.palette.getAccent(),
        textTransform: "capitalize"
    };
}

export function descriptionStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle1),
        color: theme.palette.getAccent600(),
        wordBreak: "break-word"
    };
}

export function arrowImageStyle() : CSSProperties {
    return {
        width: "12px",
        height: "12px",
        flexShrink: "0"
    };
}

export function textContentContainerStyle() : CSSProperties {
    return {
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        rowGap: "8px",
        flexGrow: "1"
    };
}
