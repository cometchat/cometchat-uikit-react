export const messageActionStyle = (props) => {

    const topPos = (props.name) ? { top: "-4px"} : { top: "-30px" };
    const alignment = (props.message.messageFrom === "receiver") ? { alignSelf: "flex-start" } : { alignSelf: "flex-end" };
    const direction = (props.message.messageFrom === "receiver") ? { 
        flexDirection: "row-reverse",
        "li:not(:first-of-type)": {
            marginRight: "8px",
        }

    } : {
        "li:not(:last-of-type)": {
            marginRight: "8px",
        }
    };

    return {
        position: "absolute",
        zIndex: "1",
        display: "flex",
        listStyleType: "none",
        padding: "8px",
        margin: "0",
        height: "35px",
        border: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.white}`,
        borderRadius: "4px",
        alignItems: "center",
        justifyContent: "center",
        ...alignment,
        ...topPos,
        ...direction,
    }
}

export const actionGroupStyle = (props) => {

    return {
        display: "flex",
        position: "relative",
    }
}

export const groupButtonStyle = (props, img) => {

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
        background: `url(${img}) center center / 20px 19px no-repeat`,
    }
}