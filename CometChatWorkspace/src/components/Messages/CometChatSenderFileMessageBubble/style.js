export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
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
        alignSelf: "flex-end",
        display: "flex",
    }
}

export const messageFileWrapper = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        backgroundColor: `${props.theme.backgroundColor.blue}`,
        color: `${props.theme.color.white}`,
        padding: "8px 16px",
        alignSelf: "flex-end",
        maxWidth: "100%",
        ".message__file": {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "0 0",
            textDecoration: "none",
            color: `${props.theme.color.white}`,
            maxWidth: "100%",
            fontSize: "14px",
            "&:visited, &:active, &:hover": {
                color: `${props.theme.color.white}`,
                textDecoration: "none",
            },
            "> p": {
                margin: "0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                textAlign: "left",
                width: "100%",
                fontSize: "14px",
                marginLeft: "8px"
            }
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
    }
}

export const messageReactionsWrapperStyle = () => {

    return {
        display: "inline-flex",
        alignSelf: "flex-end",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    }
}