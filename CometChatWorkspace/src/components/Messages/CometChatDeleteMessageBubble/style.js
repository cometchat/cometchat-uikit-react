import { CometChat } from "@cometchat-pro/chat";

export const messageContainerStyle = (props, loggedInUser) => {

    const alignment = (props.message?.sender?.uid === loggedInUser?.uid) ? {
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

export const messageWrapperStyle = (props, loggedInUser) => {

    const alignment = (props.message?.sender?.uid === loggedInUser?.uid) ? {
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

export const messageTxtWrapperStyle = (props, context, loggedInUser) => {


    const alignment = (props.message?.sender?.uid === loggedInUser?.uid) ? {
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
        backgroundColor: `${context.theme.backgroundColor.secondary}`,
        fontStyle: "italic",
        ...alignment
    }
}

export const messageTxtStyle = context => {

	return {
		fontSize: "14px!important",
		margin: "0",
		lineHeight: "20px!important",
		color: `${context.theme.color.helpText}`,
	};
};

export const messageInfoWrapperStyle = (props, loggedInUser) => {

    const alignment = (props.message?.sender?.uid === loggedInUser?.uid) ? {
        alignSelf : "flex-end",
    } : {
        alignSelf: "flex-start",
    };

    return {
        ...alignment,
    }
}

export const messageTimeStampStyle = context => {

	return {
		display: "inline-block",
		fontSize: "11px",
		fontWeight: 500,
		lineHeight: "12px",
		textTransform: "uppercase",
		color: `${context.theme.color.helpText}`,
	};
};

export const messageThumbnailStyle = () => {

    return {
        width: "36px",
        height: "36px",
        margin: "12px 0",
        float: "left",
    }
}

export const messageDetailStyle = (props, loggedInUser) => {

	let paddingSpace = {};
	if (props.message?.sender?.uid !== loggedInUser?.uid && props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
		paddingSpace = {
			paddingLeft: "5px",
		};
	}

	return {
		flex: "1 1",
		display: "flex",
		flexDirection: "column",
		position: "relative",
		...paddingSpace,
	};
};

export const nameWrapperStyle = (props, loggedInUser) => {

	let paddingSpace = {};
	if (props.message?.sender?.uid !== loggedInUser?.uid && props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
		paddingSpace = {
			padding: "3px 5px",
		};
	}

	return {
		alignSelf: "flex-start",
		...paddingSpace,
	};
};

export const nameStyle = context => {
	return {
		fontSize: "10px",
		color: `${context.theme.color.helpText}`,
	};
};