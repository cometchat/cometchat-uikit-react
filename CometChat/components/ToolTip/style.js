export const messageActionStyle = (props) => {

    const topPos = (props.name) ? { top: "0px"} : { top: "-20px" };
    const alignment = (props.message.messageFrom === "receiver") ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" };

    return {
        position: "absolute",
        zIndex: "1",
        display: "none",
        listStyleType: "none",
        padding: "0",
        margin: "0",
        height: "26px",
        border: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.white}`,
        borderRadius: "4px",
        alignItems: "center",
        justifyContent: "center",
        ...alignment,
        ...topPos,
    }
}

export const actionGroupStyle = (props) => {

    return {
        display: "flex",
        position: "relative",
    }
}

export const groupButtonStyle = (img) => {

    return {
        outline: "0",
        border: "0",
        height: "24px",
        width: "24px",
        borderRadius: "4px",
        alignItems: "center",
        display: "inline-flex",
        justifyContent: "center",
        position: "relative",
        background: `url(${img}) center center / 18px 19px no-repeat`,
    }
}