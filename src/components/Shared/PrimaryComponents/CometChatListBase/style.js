import { CometChatLocalize } from "../..";

export const listBaseStyle = (style, theme) => {
    return {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        width: style?.width,
        height: style?.height,
        background: style?.background ?? theme?.palette?.getAccent500(),
        borderRadius: style?.borderRadius,
        border: style?.border,
        overflowY: "auto"
    };
};

export const listBaseHeadStyle = (style, hideSearch) => {
    const height = !hideSearch
        ? {
            height: "100px",
        }
        : {
            height: "64px",
        };

    return {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: style?.width,
        ...height,
    };
};

export const listBaseNavStyle = (style) => {
    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: style?.height,
        width: style?.width,
        padding: "0px",
    };
};

export const backButtonStyle = (style, theme, showBackButton, backButtonIconURL) => {
    return {
        WebkitMask: `url(${backButtonIconURL}) no-repeat left center`,
        backgroundColor: `${style?.backIconTint ?? theme?.palette?.getPrimary()}`,
        height: "24px",
        width: "24px",
        cursor: "pointer",
        visibility: showBackButton ? `url(${backButtonIconURL}) no-repeat left center` : 'hidden'
    };
};

export const listBaseTitleStyle = (style, theme) => {
    return {
        padding: '8px',
        font: style?.titleFont,
        color: style?.titleColor ?? theme?.palette?.getAccent(),
        lineHeight: "26px",
        width: style?.width,
    };
};

export const listBaseSearchStyle = (style, theme) => {
    return {
        background: style?.searchBackground ?? theme?.palette?.getAccent500(),
        font: style?.searchTextFont,
        cursor: "pointer",
        color: style?.searchTextColor ?? theme?.palette?.getAccent(),
        lineHeight: "20px",
        height: "50px",
        width: "calc(100% - 30px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "16px",
        paddingLeft: "8px",
        borderRadius: style?.searchBorderRadius,
    };
};

export const listBaseSearchButtonStyle = (style, theme, searchIconURL) => {
    return {
        WebkitMask: `url(${searchIconURL}) no-repeat left center`,
        background: style?.searchIconTint ?? theme?.palette?.getPrimary(),
        border: "none",
        borderRadius: style?.searchBorderRadius,
        width: "24px",
        padding: "8px 0 8px 8px",
        cursor: "default",
    };
};

export const listBaseSearchInputStyle = (style, theme) => {
    const padding = CometChatLocalize.isRTL()
        ? { padding: "8px 0 8px 8px" }
        : { padding: "8px 8px 8px 0" };
    return {
        width: "calc(100% - 35px)",
        outline: "none",
        height: style?.height,
        font: style?.searchTextFont,
        color: style?.searchTextColor ?? theme?.palette?.getAccent(),
        background: "transparent",
        border: "white",
        padding: "8px 0 8px 0px",
    };
};

export const listBaseContainerStyle = (style, hideSearch) => {
    const height = !hideSearch
        ? {
            height: "calc(100% - 100px)",
        }
        : {
            height: "calc(100% - 64px)",
        };

    return {
        background: "inherit",
        width: style?.width,
        ...height,
    };
};
