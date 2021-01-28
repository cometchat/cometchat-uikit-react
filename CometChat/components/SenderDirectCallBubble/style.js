export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
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
        alignSelf: "flex-end",
        display: "flex",
    }
}

export const messageTxtWrapperStyle = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        backgroundColor: `${props.theme.backgroundColor.blue}`,
        color: `${props.theme.color.white}`,
        padding: "16px",
        alignSelf: "flex-end",
        width: "auto",
        minHeight: "106px",
    }
}

export const messageTxtContainerStyle = () => {

    return {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        "img": {
            width: "35px"
        }
    }
}

export const messageTxtStyle = () => {

    return {
        margin: "0",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
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
        width: "100%",
        "li": {
            backgroundColor: `${props.theme.backgroundColor.white}`,
            borderRadius: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            position: "relative",
            margin: "16px 0 0 0",
            padding: "8px",
            cursor: "pointer",
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