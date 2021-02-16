export const messageContainerStyle = (props) => {

    const alignment = (props.messageOf === "sender") ? {
        alignSelf: "flex-end"
    } : {
        alignSelf: "flex-start"
    };

    return {
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
        clear: "both",
        flexShrink: "0",
        ...alignment
    }
}

export const messageWrapperStyle = (props) => {

    const alignment = (props.messageOf === "sender") ? {
        display: "flex",
        flexDirection : "column",
    } : {};

    return {
        flex: "1 1",
        position: "relative",
        width: "100%",
        ...alignment
    }
}

export const messageTxtWrapperStyle = (props) => {

    const alignment = (props.messageOf === "sender") ? {
        alignSelf: "flex-end",
    } : {
        alignSelf: "flex-start",
    };

    return {
        display: "inline-block",
        borderRadius: "12px",
        padding: "8px 12px",
        alignSelf: "flex-end",
        Width: "100%",
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        fontStyle: "italic",
        ...alignment
    }
}

export const messageTxtStyle = (props) => {

    return {
        fontSize: "14px!important",
        margin: "0",
        lineHeight: "20px!important",
        color: `${props.theme.color.helpText}`
    }
}

export const messageInfoWrapperStyle = (props) => {

    const alignment = (props.messageOf === "sender") ? {
        alignSelf : "flex-end",
    } : {
        alignSelf: "flex-start",
    };

    return alignment
}

export const messageTimeStampStyle = (props) => {

    return {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        lineHeight: "12px",
        textTransform: "uppercase",
        color: `${props.theme.color.helpText}`,
    }
}

export const messageThumbnailStyle = () => {

    return {
        width: "36px",
        height: "36px",
        margin: "12px 0",
        float: "left",
    }
}

export const messageDetailStyle = (props) => {

    let paddingSpace = {};
    if (props.messageOf === "receiver" && props.message.receiverType === 'group') {

        paddingSpace = {
            paddingLeft: "5px"
        };
    }

    return {
        flex: "1 1",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...paddingSpace
    }
}

export const nameWrapperStyle = (props) => {

    let paddingSpace = {};
    if (props.messageOf === "receiver" && props.message.receiverType === 'group') {

        paddingSpace = {
            padding: "3px 5px"
        };
    }

    return {
        alignSelf: "flex-start",
        ...paddingSpace,
    }
}

export const nameStyle = (props) => {
    return {
        fontSize: "10px",
        color: `${props.theme.color.helpText}`,
    }
}