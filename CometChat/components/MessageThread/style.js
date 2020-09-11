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

export const messageContainerStyle = () => {

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
        ".css-1z1zpa": {
            minHeight: "250px",
            ".css-1ridola": {
                "::-webkit-scrollbar": {
                    display: "none"
                }
            },
            " div:hover": {
                "ul.css-10hykrq": {
                    display: "none"
                },
                "ul.css-hwrlsc": {
                    display: "none"
                },
            }
        }
    }
}

export const parentMessageStyle = () => {

    return {
        padding: "14px 16px",
    }
}

export const parentMessageContainerStyle = (message, props) => {

    const alignment = (message.messageFrom === "sender") ? {
        alignItems: "flex-end",
    } : {
        alignItems: "flex-start",
    };

    return {
        display: "flex",
        flexDirection: "column",
        ...alignment
    }
}

export const parentMessageWrapperStyle = (message, props) => {

    const colorProp = (message.messageFrom === "sender") ? {
        backgroundColor: props.theme.backgroundColor.blue,
        color: props.theme.color.white
    } : {
        backgroundColor: props.theme.backgroundColor.secondary,
        "a": {
            color: props.theme.color.primary
        }
    };

    return {
        display: "inline-block",
        padding: "8px 12px",
        borderRadius: "12px",
        height: "100%",
        maxWidth: "100%",
        ...colorProp,
        "img": {
            maxWidth: "100%",
        },
        "a": {
            color: `${props.theme.color.white}`,
            maxWidth: "100%",
            "img": {
                maxWidth: "100%",
            }
        },
        "audio, video": {
            maxWdth: "100%",
            display: "inherit",
        }
    }
}

export const messageTxtStyle = () => {

    return {
        margin: 0,
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        textAlign: "left",
        fontSize: "14px"
    }
}

export const messageTimestampStyle = () => {

    return {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: "500",
        lineHeight: "12px",
        textTransform: "uppercase",
        padding: "0 12px",
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