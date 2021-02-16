export const wrapperStyle = (props) => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: `${props.theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${props.theme.fontFamily}`,
        }
    }
}

export const headerStyle = (props) => {

    return {
        padding: "12px 16px",
        width: "100%",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        zIndex: "1",
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
    }
}

export const headerWrapperStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    }
}

export const headerDetailStyle = () => {

    return {
        display: "flex",
        flexDirection: "column",
        width: "calc(100% - 40px)",
    }
}

export const headerTitleStyle = () => {

    return {
        margin: "0",
        fontSize: "15px",
        fontWight: "600",
        lineHeight: "22px",
        width: "100%",
    }
}

export const headerNameStyle = () => {

    return {
        fontSize: "13px",
        lineHeight: "20px",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }
}

export const headerCloseStyle = (img) => {

    return {
        cursor: "pointer",
        background: `url(${img}) center center no-repeat`,
        width: "24px",
        height: "24px",
    }
}

export const messageContainerStyle = (event) => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowX: "hidden",
        overflowY: "auto",
        transition: "background .3s ease-out .1s",
        width: "100%",
        zIndex: "100",
        minHeight: "calc(100% - 68px)",
        order: "2",
        ".chat__list": {
            minHeight: "250px",
            ".list__wrapper": {
                "::-webkit-scrollbar": {
                    display: "none"
                },
                scrollbarWidth: "none"
            }
        },
    }
}

export const parentMessageStyle = (message) => {

    const alignment = (message.messageFrom === "sender") ? {
        justifyContent: "flex-end",
    } : {
        justifyContent: "flex-start",
    };

    return {
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        ...alignment,
        ".sender__message__container, .receiver__message__container": {
            maxWidth: "100%",
            "&:hover": {
                ".message__actions": {
                    display: "none"
                }
            }
        },
        ".replycount": {
            display: "none"
        }
    }
}

export const messageSeparatorStyle = (props) => {

    return {
        display: "flex",
        alignItems: "center",
        position: "relative",
        margin: "7px 16px",
        height: "15px",
        "hr": {
            flex: "1",
            margin: "1px 0 0 0",
            borderTop: `1px solid ${props.theme.borderColor.primary}`,
        }
    }
}

export const messageReplyStyle = () => {

    return {
        marginRight: "12px",
        fontSize: "12px",
    }
}