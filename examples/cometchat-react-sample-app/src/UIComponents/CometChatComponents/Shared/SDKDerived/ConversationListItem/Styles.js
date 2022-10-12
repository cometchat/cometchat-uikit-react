import { fontHelper } from "@cometchat-pro/react-ui-kit"

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
    }
}

export const wrapperStyle = (theme) => {
    return {
        width: "100%",
        padding: "20px",
    }
}