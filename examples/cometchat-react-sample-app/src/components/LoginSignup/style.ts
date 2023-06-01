import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function loginSignupStyle() : CSSProperties {
    return {
        height: "100%",
        display: "flex",
        justifyContent: "center"
    };
}

export function mainContainerStyle() : CSSProperties {
    return {
        width: "min(100%, 1400px)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        rowGap: "8px",
        boxSizing: "border-box",
        padding: "8px"
    };
}

export function headerStyle(theme : CometChatTheme) : CSSProperties {
    return {
        width: "100%",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: `1px solid ${theme.palette.getAccent100()}`
    };
}

export function contentContainerStyle() : CSSProperties {
    return {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        columnGap: "8px"
    };
}

export function footerStyle(theme : CometChatTheme) : CSSProperties {
    return {
        padding: "16px",
        flexGrow: "1",
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getAccent500(),
        display: "flex",
        alignItems: "flex-end"
    };
}

export function chatHeaderTextStyle() : CSSProperties {
    return {
        fontWeight: "bold"
    };
}

export function contentStyle(isMobileView : boolean) : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "8px",
        width: isMobileView ? "80%" : "50%"
    };
}

export function titleStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.heading),
        color: theme.palette.getAccent()
    };
}

export function cardStyle() : CSSProperties {
    return {
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 0 8px rgb(20, 20, 20, 0.33)",
        padding: "16px"
    };
}

export function imageStyle(showImage : boolean) : CSSProperties {
    return {
        display: showImage ? "inline" : "none",
        width: "50%",
        backgroundSize: "contain"
    };
}

export function headerTitle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.name)
    };
}

export function versionStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getAccent400()
    };
}
