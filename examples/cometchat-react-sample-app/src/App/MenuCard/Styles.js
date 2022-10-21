import { fontHelper } from "@cometchat-pro/react-ui-kit";

export const cardTitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.title1),
        color: theme?.palette?.getAccent()
    }
}

export const cardStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        boxShadow: `${theme?.palette?.getAccent400()} 0px 0px 5px`,
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        cursor: "pointer",
        margin: "20px 0px",
        height: "100%",
        padding: "11px",
        borderRadius: "12px",
}
}

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600(),
        paddingTop: "10px"

    }
}

export const iconStyle = (theme, rightconURL) => {
    return {

        WebkitMask: `url(${rightconURL}) center center no-repeat`,
        background: theme?.palette?.getAccent600(),
        height: "24px",
        width: "24px"


    }
}