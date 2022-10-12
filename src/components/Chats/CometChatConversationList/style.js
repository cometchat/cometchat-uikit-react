import { fontHelper } from "../../Shared";

export const chatsListStyle = (style, theme) => {
    return {
        width: style?.width,
        height: style?.height,
        border: style?.border,
        background: style?.background || theme?.palette?.getBackground(),
        position: "relative",
        flexDirection: "column",
        display: "flex",
        overflowX: "hidden",
        overflowY: "scroll",
        margin: "0",
        padding: "0",
        borderRadius: style?.borderRadius,
    };
};

export const messageContainerStyle = (style) => {
    return {
        overflow: "hidden",
        width: style?.width,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: "30%",
        zIndex: 1,
    };
};

export const messageTextStyle = (style, theme, message) => {
    let color = { color: theme?.palette?.getAccent400() };
    let font = { font: fontHelper(theme?.typography?.heading) };
    if (message && message?.toLowerCase() === "no_users_found") {
        if (style?.emptyTextColor) {
            color = { color: style?.emptyTextColor };
        }

        if (style?.emptyTextFont) {
            font = { font: style?.emptyTextFont };
        }
    } else if (message && message?.toLowerCase() === "something_wrong") {
        color = { color: theme?.palette?.getError() };

        if (style?.errorTextColor) {
            color = { color: style?.errorTextColor };
        }

        if (style?.errorTextFont) {
            font = { font: style?.errorTextFont };
        }
    }
    return {
        minHeight: "36px",
        lineHeight: "30px",
        wordWrap: "break-word",
        padding: "0 16px",
        width: "calc(100% - 32px)",
        display: "flex",
        margin: "0",
        justifyContent: "center",
        ...color,
        ...font,
    };
};
export const messageImgStyle = (style, theme, loadingIconURL) => {
    let background = { background: theme?.palette?.getAccent600() };

    if (style?.loadingIconTint) {
        background = { background: style?.loadingIconTint };
    }
    return {
        WebkitMask: `url(${loadingIconURL}) center center no-repeat`,
        ...background,
        margin: "0",
        minHeight: "260px",
        lineHeight: "30px",
        wordWrap: "break-word",
        padding: "0 16px",
        width: style?.width,
    };
};
export const listItemStyle = (style, theme) => {
    return {
        background: style?.background,
        activeBackground: theme?.palette?.getAccent50(),
        border: `1px solid ${theme?.palette?.getAccent200()}`,
        borderRadius: "50%",
        titleColor: theme?.palette?.getAccent(),
        titleFont: fontHelper(theme?.typography?.title2),
        subtitleColor: theme?.palette?.getAccent600(),
        subtitleFont: fontHelper(theme?.typography?.subtitle2),
        typingIndicatorTextColor: theme?.palette?.getAccent600(),
        typingIndicatorTextFont: fontHelper(theme?.typography?.subtitle2),
    };
};
export const DialogStyle = (theme) => {
    return {
        width: "300px",
        height: "225px",
        background: theme?.palette?.getAccent900(),
        border: theme?.palette?.getAccent50(),
        borderRadius: "4px",
        confirmButtonTextFont: fontHelper(theme?.typography?.title2),
        confirmButtonTextColor: theme?.palette?.getAccent900(),
        cancelButtonTextFont: fontHelper(theme?.typography?.title2),
        cancelButtonTextColor: theme?.palette?.getAccent(),
        titleTextFont: fontHelper(theme?.typography?.heading),
        titleTextColor: theme?.palette?.getAccent(),
        confirmBackground: theme?.palette?.getError(),
        cancelBackground: theme?.palette?.getAccent500(),
        messageTextFont: fontHelper(theme?.typography?.caption1),
        messageTextColor: theme?.palette?.getAccent500(),
    };
};