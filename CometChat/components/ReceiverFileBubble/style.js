export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-start",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
        clear: "both",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: "0",
        ":hover": {
            "ul.message__actions": {
                display: "flex"
            }
        }
    }
}

export const messageWrapperStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-start",
        display: "flex",
    }
}

export const messageThumbnailStyle = () => {

    return {
        width: "36px",
        height: "36px",
        margin: "10px 5px",
        float: "left",
        flexShrink: "0",
    }
}

export const messageDetailStyle = () => {

    return {
        flex: "1 1",
        display: "flex",
        flexDirection: "column",
    }
}

export const nameWrapperStyle = (avatar) => {

    const paddingValue = (avatar) ? {
        padding: "3px 5px",
    } : {};

    return {
        alignSelf: "flex-start",
        ...paddingValue
    }
}

export const nameStyle = (props) => {

    return {
        fontSize: "10px",
        color: `${props.theme.color.helpText}`,
    }
}

export const messageFileContainerStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-start",
        display: "flex",
    }
}

export const messageFileWrapperStyle = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        color: `${props.theme.color.secondary}`,
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        padding: "8px 12px",
        alignSelf: "flex-start",
        width: "auto",
        "> a": {
            background: "0 0",
            textDecoration: "none",
            backgroundColor: "transparent",
            color: `${props.theme.color.primary}`,
            width: "auto",
            fontSize: "14px",
            "&:visited, &:active, &:hover": {
                color: `${props.theme.color.primary}`,
                textDecoration: "none",
            },
            "img": {
                backgroundColor: `${props.theme.backgroundColor.white}`
            }
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-start",
        padding: "3px 5px",
    }
}

export const messageTimestampStyle = (props) => {

    return {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: "500",
        lineHeight: "12px",
        textTransform: "uppercase",
        color: `${props.theme.color.helpText}`,
    }
}