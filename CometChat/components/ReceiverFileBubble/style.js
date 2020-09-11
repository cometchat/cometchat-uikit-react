export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-start",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
        clear: "both",
    }
}

export const messageWrapperStyle = () => {

    return {
        flex: "1 1",
        position: "relative",
        width: "100%",
    }
}

export const messageThumbnailStyle = () => {

    return {
        width: "36px",
        height: "36px",
        margin: "10px 5px",
        float: "left",
    }
}

export const messageDetailStyle = (name) => {

    const topPos = (name) ? { top: "-15px" } : { top: "-30px" };

    return {
        flex: "1 1",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ':hover': {
            'ul:first-of-type': {
                display: "inline-flex",
                ...topPos
            }
        }
    }
}

export const nameWrapperStyle = (avatar) => {

    const paddingValue = (avatar) ? {
        paddingLeft: "5px"
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

export const messageFileWrapperStyle = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        color: `${props.theme.color.secondary}`,
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        padding: "8px 12px",
        alignSelf: "flex-start",
        width: "100%",
        "> a": {
            background: "0 0",
            textDecoration: "none",
            backgroundColor: "transparent",
            color: `${props.theme.color.primary}`,
            width: "100%",
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