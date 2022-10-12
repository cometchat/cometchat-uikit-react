import { CometChatLocalize, fontHelper } from "../../Shared";


export const containerStyle = (style, theme) => {
    return {
        height: style?.height,
        width: style?.width,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        margin: '0px',
        background: style?.background || theme?.palette?.getBackground()
    };
};
export const startConversationBtnStyle = (style, theme, startConversationIconURL) => {
    const direction = CometChatLocalize.isRTL()
        ? { left: "16px" }
        : { right: "16px" };
    return {
        WebkitMask: `url(${startConversationIconURL})no-repeat left center `,
        backgroundColor: `${style?.startConversationIconTint || theme?.palette?.getPrimary()}`,
        height: "24px",
        width: "24px",
        cursor: "pointer",
        position: "absolute",
        top: "12px",
        ...direction,
    };
};
export const getListBaseStyle = (style, theme) => {
    return {
        width: "100%",
        height: "100%",
        border: style?.border,
        borderRadius: "0",
        background: style?.background || theme?.palette?.getBackground(),
        titleFont: fontHelper(theme?.typography?.heading),
        titleColor: style?.titleColor || theme?.palette?.getAccent(),
        backIconTint: style?.backIconTint || theme?.palette?.getPrimary(),
        searchBorder: style?.searchBorder || `1px solid ${theme?.palette?.getAccent50()}`,
        searchBorderRadius: style?.searchBorderRadius,
        searchBackground: style?.searchBackground || theme?.palette?.getAccent50(),
        searchTextFont: style?.searchTextFont || fontHelper(theme?.typography?.subtitle1),
        searchTextColor: style?.searchTextColor || theme?.palette?.getAccent500(),
        searchIconTint: style?.searchIconTint || theme?.palette?.getAccent500(),
    };
};
export const getConversationListStyle = (style, theme) => {
    return {
        width: "100%",
        height: "100%",
        background: style?.background,
        border: "none",
        borderRadius: "0",
        loadingIconTint: theme?.palette?.getAccent600(),
        emptyStateTextFont: fontHelper(theme?.typography?.heading),
        emptyStateTextColor: theme?.palette?.getAccent400(),
        errorStateTextFont: fontHelper(theme?.typography?.heading),
        errorStateTextColor: theme?.palette?.getAccent400(),
    };
};
