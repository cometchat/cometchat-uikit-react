import { CometChat } from "@cometchat-pro/chat";

export const messageActionStyle = (props, context, loggedInUser) => {

    const topPos = (props.message.sender?.uid !== loggedInUser?.uid && props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? { top: "-4px" } : { top: "-30px" };

    const alignment = (props.message?.sender?.uid === loggedInUser?.uid) ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" };
    const direction = (props.message?.sender?.uid === loggedInUser?.uid) ? { 
        "li:not(:last-of-type)": {
            marginRight: "8px",
        }

    } : {
        flexDirection: "row-reverse",
        "li:not(:first-of-type)": {
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