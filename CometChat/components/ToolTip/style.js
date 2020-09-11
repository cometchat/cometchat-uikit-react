export const messageActionStyle = (props) => {

    const leftPos = (props.message.messageFrom === "sender") ? { left: "0" } : {};
    return {
        position: "absolute",
        top: "-30px",
        right: "0",
        zIndex: "1",
        display: "none",
        listStyleType: "none",
        padding: "0",
        margin: "0",
        ...leftPos
    }
}

export const actionGroupStyle = (props) => {

    return {
        backgroundColor: `${props.theme.backgroundColor.white}`,
        lineHight: "1",
        marginLeft: "8px",
        border: `1px solid ${props.theme.borderColor.primary}`,
        boxShadow: `2px 2px 2px 1px ${props.theme.backgroundColor.primary}`,
        display: "flex",
        padding: "2px",
        borderRadius: ".375em",
        position: "relative",
    }
}

export const groupButtonStyle = (img) => {

    return {
        outline: "0",
        border: "0",
        height: "32px",
        width: "32px",
        borderRadius: "4px",
        alignItems: "center",
        display: "inline-flex",
        justifyContent: "center",
        position: "relative",
        background: `url(${img}) center center / 18px 19px no-repeat`,
    }
}