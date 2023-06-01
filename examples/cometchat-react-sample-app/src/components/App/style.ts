import { CSSProperties } from "react";
import { CometChatTheme } from "uikit-resources-lerna";

const LOGGED_IN_USER_INFO_CONTAINER_HEIGHT = "48px";
const FOOTER_HEIGHT = "48px";

export function appStyle(theme : CometChatTheme) : CSSProperties {
    return {
        height: "100%",
        boxSizing: "border-box",
        backgroundColor: theme.palette.getBackground(),
        position: "relative",
        overflowX: "hidden"
    };
}

export function footerStyle() : CSSProperties {
    return {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: FOOTER_HEIGHT
    };
}

export function messageStyle(isError : boolean) : CSSProperties {
    return {
        padding: "16px",
        color: "white",
        textAlign: "center",
        backgroundColor: isError ? "red" : "green",
        borderRadius: "8px",
        width: "300px",
        boxSizing: "border-box",
        position: "fixed",
        top: "32px",
        left: "50%",
        transform: "translateX(-50%)"
    };
}

export function loggedInUserInfoContainerStyle() : CSSProperties {
    return {
        height: LOGGED_IN_USER_INFO_CONTAINER_HEIGHT,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        columnGap: "8px",
        padding: "0 16px"
    };
}

export function uidStyle() : CSSProperties {
    return {
        fontWeight: "600"
    };
}

export function logoutBtnStyle() : CSSProperties {
    return {
        cursor: "pointer",
        backgroundColor: "transparent",
        border: "none"
    };
}

export function logoutImgStyle() : CSSProperties {
    return {
        width: "24px",
        height: "24px"
    };
}

export function loadingModalStyle(showModal : boolean) : CSSProperties {
    return {
        display: showModal ? "flex" : "none",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#393b39",
        position: "fixed",
        top: "0",
        left: "0",
        justifyContent: "center",
        alignItems: "center"
    };
}

export function imageStyle() : CSSProperties {
    return {
        backgroundSize: "cover"
    };
}