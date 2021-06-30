export const messageActionStyle = (props, context) => {

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
        border: `1px solid ${context.theme.borderColor.primary}`,
        backgroundColor: `${context.theme.backgroundColor.white}`,
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

export const groupButtonStyle = (img, context, deleteOption) => {

    const backgroundProp = (deleteOption) ? {
        backgroundColor: `${context.theme.color.red}!important`
    } : {
        backgroundColor: `${context.theme.secondaryTextColor}!important`
    };

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
        mask: `url(${img}) center center no-repeat`,
        ...backgroundProp
    }
}