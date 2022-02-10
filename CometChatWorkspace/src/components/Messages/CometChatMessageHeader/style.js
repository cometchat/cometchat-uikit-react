import { CometChat } from "@cometchat-pro/chat";

export const chatHeaderStyle = props => {

	return {
		padding: "16px",
		width: "100%",
		background: props.background,
		zIndex: "1",
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		border: props.border,
	};
};

export const chatDetailStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "calc(100% - 116px)",
    }
}

export const chatThumbnailStyle = () => {

    return {
        display: "inline-block",
        flexShrink: "0",
        marginRight: "16px",
        position: "relative"
    }
}

export const chatUserStyle = () => {

	return {
		width: "calc(100% - 50px)",
		padding: "0",
		flexGrow: "1",
		display: "flex",
		flexDirection: "column",
		[`@media (minWidth: 320px) and (maxWidth: 768px)`]: {
			width: "calc(100% - 80px)!important",
		},
	};
};

export const chatNameStyle = () => {

    return {
        margin: "0",
        fontSize: "15px",
        fontWeight: "600",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }
}

export const chatStatusStyle = (userPresence, type, typingText) => {

    let status = {};
    if (type === CometChat.ACTION_TYPE.TYPE_USER) {

        status = {
            color: `#39f`,
            textTransform: "capitalize",
        };

        if (userPresence === "offline") {
            status = {
                color: `rgba(20, 20, 20, 0.6)`,
                textTransform: "capitalize",
            }
        } 

        if (typingText && typingText.length) {
            status = {
                color: `rgba(20, 20, 20, 0.6)`,
                textTransform: "none",
                fontStyle: "italic",
            };
        }
        
    } else if (type === CometChat.ACTION_TYPE.TYPE_GROUP) {

        status = {
            color: `rgba(20, 20, 20, 0.6)`,
        }

        if (typingText && typingText.length) {
            status = {
                color: `rgba(20, 20, 20, 0.6)`,
                fontStyle: "italic",
            };
        }
    }

    return {
        fontSize: "13px",
        width: "100%",
        ...status
    }
}

export const chatOptionWrapStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "auto",
    }
}