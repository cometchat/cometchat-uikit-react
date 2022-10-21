import { fontHelper } from "@cometchat-pro/react-ui-kit"

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
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

export const btnStyle = (theme) => {
    return {
        background: theme?.palette?.getPrimary(),
        color: theme?.palette?.getBackground(),
        width: "80px",
        padding: "10px",
        borderRadius: "5px",
        cursor: "pointer"
    }
}