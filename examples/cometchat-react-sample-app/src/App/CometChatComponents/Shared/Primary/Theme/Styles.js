import { fontHelper } from "@cometchat-pro/react-ui-kit"

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
    }
}

export const btnStyle = (theme) => {
    return {
        background: theme?.palette?.getPrimary(),
        color: theme?.palette?.getBackground(),
        width: "100%",
        padding: "10px",
        borderRadius: "5px",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
}