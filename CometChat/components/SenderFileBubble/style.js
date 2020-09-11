export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
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
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: "100%",
        ':hover': {
            'ul:first-of-type': {
                display: "inline-flex"
            }

        }
    }
}

export const messageFileWrapper = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        backgroundColor: `${props.theme.backgroundColor.blue}`,
        color: `${props.theme.color.white}`,
        padding: "8px 12px",
        alignSelf: "flex-end",
        maxWidth: "100%",
        "> a": {
            background: "0 0",
            textDecoration: "none",
            color: `${props.theme.color.white}`,
            maxWidth: "100%",
            fontSize: "14px",
            "&:visited, &:active, &:hover": {
                color: `${props.theme.color.white}`,
                textDecoration: "none",
            },
            "img": {
                backgroundColor: `${props.theme.backgroundColor.white}`,
            }
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
    }
}