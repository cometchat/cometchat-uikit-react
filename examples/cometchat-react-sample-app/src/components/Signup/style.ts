import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function formStyle() : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "16px"
    };
}

export function generateUidCheckboxStyle() : CSSProperties {
    return {
        width: "24px",
        height: "24px",
        cursor: "pointer"
    };
}

export function generateUidStyle() : CSSProperties {
    return {
        display: "flex",
        columnGap: "4px",
        alignItems: "center",
        marginBottom: "16px"
    };
}

export function checkboxTextStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getAccent600("light")
    };
}

export function submitBtnStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle1),
        color: theme.palette.getAccent900("light"),
        backgroundColor: theme.palette.getPrimary(),
        padding: "8px 4px",
        borderRadius: "8px",
        border: `1px solid ${theme.palette.getAccent100("light")}`,
        cursor: "pointer"
    };
}

export function errorMessageStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getError(),
        height: "48px",
        overflowY: "auto"
    };
}
