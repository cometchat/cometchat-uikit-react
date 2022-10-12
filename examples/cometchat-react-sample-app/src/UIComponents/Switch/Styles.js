import { fontHelper } from "@cometchat-pro/react-ui-kit";

export const switchButtonsStyle = () => {
    return {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 0px"
    }
}

export const modeTitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.title1),
        color: theme?.palette?.getAccent(),

    }
}

export const tabListStyle = (theme) => {
    return {
        background: theme?.palette?.getAccent100(),
        borderRadius: "12px",
        width: "200px",
        display: "flex",
        padding: "5px"
    }
}

export const modeStyle = (theme, type, activeTab) => {
    return {
        font: fontHelper(theme?.typography?.subtitle1),
        color: theme?.palette?.getAccent(),
        background: activeTab == type ? theme?.palette?.getBackground() : "transparent",
        borderRadius: activeTab == type || type == type ? "12px" : "none",
        padding: "12px",
        textAlign: "center",
        width: "100px",
        cursor: "pointer",
    }
}