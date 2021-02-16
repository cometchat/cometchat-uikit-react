export const chatComposerStyle = (props) => {

    return {
        padding: "16px",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        zIndex: "1",
        order: "3",
        position: "relative",
        flex: "none",
        minHeight: "105px",
    }
}

export const editPreviewContainerStyle = (props, keyframes) => {

    const slideAnimation = keyframes`
    from {
        bottom: -60px
    }
    to {
        bottom: 0px
    }`;

    return {
        padding: "7px",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        borderColor: `${props.theme.borderColor.primary}`,
        borderWidth: "1px 1px 1px 5px",
        borderStyle: "solid",
        color: `${props.theme.color.helpText}`,
        fontSize: "13px",
        animation: `${slideAnimation} 0.5s ease-out`,
        position: "relative",
    }
}

export const previewHeadingStyle = () => {

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    }
}

export const previewTextStyle = () => {

    return {
        padding: "5px 0",
    }
}

export const previewCloseStyle = (img) => {

    return {
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background: `url(${img}) center center no-repeat`,
        cursor: "pointer",
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

export const inputInnerStyle = (props, state) => {

    const borderRadiusVal = (state.emojiViewer || state.stickerViewer) ? {
        borderRadius: "0 0 8px 8px",
    } : {
        borderRadius: "8px",
    };

    return {
        flex: "1 1 auto",
        position: "relative",
        outline: "none",
        border: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.white}`,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "85px",
        ...borderRadiusVal
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
        padding: "16px",
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

export const inputStickyStyle = (props, disabled) => {

    const disabledState = (disabled) ? {
        pointerEvents: "none",
    } : {};

    return {
        padding: "8px 16px",
        height: "40px",
        borderTop: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.grey}`,
        display: "flex",
        justifyContent: "space-between",
        ...disabledState,
        '&:empty:before': {
            pointerEvents: "none",
        }
    }
}

export const stickyAttachmentStyle = () => {

    return {
        display: "flex",
        width: "auto"
    }
}

export const attachmentIconStyle = () => {

    return {
        margin: "auto 0",
        width: "24px",
        height: "20px",
        cursor: "pointer",
    }
}

export const filePickerStyle = (state) => {

    const active = (state.showFilePicker) ? {
        width: "calc(100% - 20px)",
        opacity: "1",
    } : {};

    return {
        width: "0",
        borderRadius: "8px",
        overflow: "hidden",
        zIndex: "1",
        opacity: "0",
        transition: "width 0.5s linear",
        ...active,
    }
}

export const fileListStyle = () => {

    return {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 0 0 16px",
    }
}

export const fileItemStyle = () => {


    return {
        height: "24px",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 16px 0 0",
        ' > input': {
            display: "none",
        },
    }
}

export const stickyAttachButtonStyle = () => {

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        width: "20px",
    }
}

export const stickyButtonStyle = (props, state) => {

    const active = (state.showFilePicker) ? {
        display: "none",
    } : {
        display: "flex",
    };

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        width: "auto",
        ...active
    }
}

export const emojiButtonStyle = () => {

    return {
        height: "24px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 0 0 16px",
    }
}

export const sendButtonStyle = () => {

    return {
        height: "24px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 0 0 16px",
    }
}

export const reactionBtnStyle = () => {

    return {
        cursor: "pointer",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 0 0 16px",
    }
}

export const stickerBtnStyle = () => {

    return {
        cursor: "pointer",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 0 0 16px",
    }
}