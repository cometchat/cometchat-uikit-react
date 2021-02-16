export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-start",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "305px",
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

export const messageTxtContainerStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-start",
        display: "flex",
    }
}

export const messageTxtWrapperStyle = (props) => {

    return {
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        padding: "16px",
        alignSelf: "flex-start",
        width: "100%",
    }
}

export const messageTxtTitleStyle = (props) => {

    return {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: `${props.theme.color.primary}`,
    }
}

export const messageTxtStyle = () => {

    return {
        margin: "0",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        textAlign: "left",
        width: "100%",
        fontSize: "14px",
        marginLeft: "8px"
    }
}

export const messageBtnStyle = (props) => {

    return {
        listStyleType: "none",
        padding: "0",
        margin: "0",
        "li": {
            backgroundColor: `${props.theme.backgroundColor.white}`,
            borderRadius: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            cursor: "pointer",
            position: "relative",
            margin: "16px 0 0 0",
            padding: "8px",
            "> p": {
                background: "0 0",
                textAlign: "center",
                color: `${props.theme.color.primary}`,
                width: "100%",
                display: "inline-block",
                fontSize: "14px",
                margin: "0",
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

export const messageReactionsWrapperStyle = () => {

    return {
        display: "inline-flex",
        alignSelf: "flex-start",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "flex-start",
    }
}