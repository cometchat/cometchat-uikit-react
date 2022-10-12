import { fontHelper } from "@cometchat-pro/react-ui-kit"

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
    }
}

export const container = () => {
    return {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
    }
}

export const inputStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle1),
        color: theme?.palette?.getAccent600(),
        border: `3px solid ${theme?.palette?.getAccent100()}`,
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        outline: "none"
    }
}

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
        background: activeTab == type ? type : "transparent",
        borderRadius: activeTab == type || type == type ? "5px" : "none",
        width: "30px",
        height: "40px",
        textAlign: "center",
        width: "100px",
        cursor: "pointer",
        borderRight: `1px solid ${theme?.palette?.getAccent100()}`
    }
}