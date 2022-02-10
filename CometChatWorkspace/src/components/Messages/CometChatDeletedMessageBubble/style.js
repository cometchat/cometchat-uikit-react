import { CometChatMessageReceiverType } from "../";


export const messageContainerStyle = (props) => {

    const alignment = (props.messageObject?.sender?.uid === props.loggedInUser?.uid) ? {
        alignSelf: "flex-end"
    } : {
        alignSelf: "flex-start"
    };

    return {
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        clear: "both",
        flexShrink: "0",
        ...alignment
    }
}

export const messageWrapperStyle = (props) => {

    const alignment = (props.messageObject?.sender?.uid === props.loggedInUser?.uid) ? {
        display: "flex",
        flexDirection : "column",
    } : {};

    return {
			flex: "1 1",
			position: "relative",
			width: "100%",
			display: "flex",
			...alignment,
		};
}

export const messageTxtWrapperStyle = (props) => {


    const alignment = (props.messageObject?.sender?.uid === props.loggedInUser?.uid) ? {
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
        backgroundColor: `#f6f6f6`,
        fontStyle: "italic",
        ...alignment
    }
}

export const messageTxtStyle = () => {

	return {
		fontSize: "14px!important",
		margin: "0",
		lineHeight: "20px!important",
		color: `rgba(20, 20, 20, 0.4)`,
	};
};

export const messageInfoWrapperStyle = (props) => {

    const alignment = (props.messageObject?.sender?.uid === props.loggedInUser?.uid) ? {
        alignSelf : "flex-end",
    } : {
        alignSelf: "flex-start",
    };

    return {
        ...alignment,
    }
}

export const messageTimeStampStyle = () => {

	return {
		display: "inline-block",
		fontSize: "11px",
		fontWeight: 500,
		lineHeight: "12px",
		textTransform: "uppercase",
		color: `rgba(20, 20, 20, 0.4)`,
	};
};

export const messageThumbnailStyle = () => {

    return {
        float: "left",
    }
}

export const messageDetailStyle = (props) => {

	return {
		padding: "8px 20px",
		width: "100%",
		display: "flex",
		flexDirection: "column",
	};
};

export const nameWrapperStyle = (props) => {

	let paddingSpace = {};
	if (props.messageObject?.sender?.uid === props.loggedInUser?.uid 
    && props.messageObject.receiverType === CometChatMessageReceiverType.group) {
		paddingSpace = {
			padding: "3px 5px",
		};
	}

	return {
		alignSelf: "flex-start",
		...paddingSpace,
	};
};

export const nameStyle = () => {
	return {
		fontSize: "10px",
		color: `rgba(20, 20, 20, 0.4)`,
	};
};