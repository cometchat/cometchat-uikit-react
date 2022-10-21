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