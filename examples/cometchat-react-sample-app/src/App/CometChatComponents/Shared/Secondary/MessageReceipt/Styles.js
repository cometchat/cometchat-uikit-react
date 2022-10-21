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
        flexWrap: "wrap",
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

export const iconStyle = () => {
    return {
        textAlign: "center",
        paddingTop: "20px",
    }
}

export const sectionHeaderStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent(),
    }
}

export const cardStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        boxShadow: `${theme?.palette?.getAccent300()} 0px 0px 10px`,
        width: "calc(30% - 20px)",
        height: "100px",
        padding: "10px",
        margin: "10px",
        borderRadius: "10px"
    }
}