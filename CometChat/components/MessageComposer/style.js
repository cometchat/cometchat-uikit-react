export const chatComposerStyle = (props) => {

    return {
        padding: "14px 16px",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        zIndex: "1",
        order: "3",
        position: "relative",
        flex: "none",
        minHeight: "105px",
    }
}

export const composerInputStyle = () => {

    return {
        display: "flex",
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-end",
        position: "relative",
        zIndex: "2",
        padding: "0",
        minHeight: "85px",
    }
}

export const inputInnerStyle = (props) => {

    return {
        flex: "1 1 auto",
        position: "relative",
        outline: "none",
        borderRadius: "8px",
        border: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.white}`,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "85px",
    }
}

export const messageInputStyle = (disabled) => {

    const disabledState = (disabled) ? {
        pointerEvents : "none",
        opacity: "0.4"
    } : {};

    return {
        width: "100%",
        fontSize: "15px",
        lineHeight: "20px",
        fontWeight: "400",
        padding: "15px 10px",
        outline: "none",
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        zIndex: "1",
        minHeight: "50px",
        maxHeight: "100px",
        userSelect: "text",
        ...disabledState,
        '&:empty:before': {
            content: "attr(placeholder)",
            color: "rgb(153, 153, 153)",
            pointerEvents: "none",
            display: "block", /* For Firefox */
        }
    }
}

export const inputStickyStyle = (props) => {

    return {
        padding: "7px 10px",
        height: "35px",
        borderTop: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.grey}`,
        display: "flex",
        justifyContent: "flex-end",
    }
}

export const stickyAttachmentStyle = () => {

    return {
        display: "flex",
        width: "calc(100% - 50px)",
    }
}

export const attachmentIconStyle = (img) => {

    return {
        margin: "auto 0",
        ' > span': {
            display: "inline-block",
            width: "20px",
            height: "20px",
            background: `url(${img}) center center no-repeat`,
            cursor: "pointer",
            // 'img': {
            //     display: "none", 
            // }
        }
    }
}

export const filePickerStyle = (state) => {

    const active = (state.showFilePicker) ? {
        width: "120px",
        opacity: "1",
        margin: "auto 10px",
    } : {};

    return {
        left: "0",
        bottom: "0",
        position: "relative",
        width: "0",
        borderRadius: "8px",
        overflow: "hidden",
        zIndex: "1",
        textAlign: "center",
        opacity: "0",
        transition: "width 0.5s linear",
        ...active
    }
}

export const fileListStyle = () => {

    return {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    }
}

export const fileItemStyle = (props, img) => {

    const icon = {
        background: `url(${img}) no-repeat 100% 100%`,
        // maskSize: "cover",
    }

    return {
        width: "21px",
        height: "21px",
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        cursor: "pointer",
        ' > input': {
            display: "none",
        },
        ...icon
    }
}

export const stickyButtonStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    }
}

export const emojiButtonStyle = () => {

    return {
        padding: "0 5px",
        '> img': {
            width: "20px",
            height: "20px",
            display: "inline-block",
            cursor: "pointer",
        }
    }
}

export const sendButtonStyle = () => {

    return {
        '> img': {
            width: "20px",
            height: "18px",
            display: "inline-block",
            cursor: "pointer",
        }
    }
}