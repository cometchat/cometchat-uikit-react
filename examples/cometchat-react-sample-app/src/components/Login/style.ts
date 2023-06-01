import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function loginStyle() : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "48px"
    };
}

export function userBtnStyle(theme : CometChatTheme) : CSSProperties {
    return {
        flexBasis: "48%",
        padding: "8px",
        backgroundColor: theme.palette.getAccent100("light"),
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        columnGap: "8px",
        cursor: "pointer",
        border: `1px solid ${theme.palette.getAccent100("light")}`,
    };
}

export function userAvatarStyle() : CSSProperties {
    return {
        width: "32px",
        height: "32px",
        backgroundColor: "white",
        borderRadius: "24px"
    };
}

export function defaultUserBtnsContainerStyle() : CSSProperties {
    return {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "8px"
    };
}

export function loginSampleUsersContainerStyle() : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px"
    }
}

export function loginBtnStyle(theme : CometChatTheme) : CSSProperties {
    return {
        backgroundColor: theme.palette.getPrimary(),
        font: fontHelper(theme.typography.subtitle1),
        color: theme.palette.getAccent900("light"),
        borderRadius: "8px",
        padding: "8px",
        border: `1px solid ${theme.palette.getAccent100("light")}`,
        width: "100%",
        cursor: "pointer"
    };
}

export function loginUidFormStyle() : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "8px"
    };
}

export function goToSignupContainerStyle() : CSSProperties {
    return {
        paddingTop: "16px",
        display: "flex",
        flexDirection: "column",
        rowGap: "16px",
        alignItems: "center",
        paddingBottom: "32px",
        textAlign: "center"
    };
}

export function goToSignupStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.title2),
        backgroundColor: "transparent",
        borderRadius: "4px",
        color: theme.palette.getAccent600("light"),
        textTransform: "capitalize",
        border: `1px solid ${theme.palette.getAccent100("light")}`,
        cursor: "pointer"
    };
}

export function usingSampleUsersTextStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getAccent600("light")
    };
}

export function noAccountStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle1),
        color: theme.palette.getAccent600("light")
    };
}

export function userNameStyle(theme : CometChatTheme) : CSSProperties {
    return {
        textTransform: "capitalize",
        font: fontHelper(theme.typography.name),
        color: theme.palette.getAccent("light"),
        textAlign: "left"
    };
}

export function userUidStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getAccent600("light")
    };
}

export function userNameAndUidContainerStyle() : CSSProperties {
    return {
        display: "flex",
        flexDirection: "column",
        rowGap: "2px",
        alignItems: "flex-start"
    };
}

export function errorMessageStyle(theme : CometChatTheme) : CSSProperties {
    return {
        font: fontHelper(theme.typography.subtitle2),
        color: theme.palette.getError()
    };
}
