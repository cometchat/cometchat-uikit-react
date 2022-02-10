import { messageAlignment } from "../";

export const messageHoverStyle = props => {
	return {
		width: `${props.width}`,
		height: `${props.height}`,
	};
};

export const messageActionsStyle = () => {
	return {
		position: "relative",
	};
};

export const messageGutterStyle = () => {
	return {
		padding: "8px 20px",
		display: "flex",
		width: "100%",
	};
};

export const messageLeftGutterStyle = props => {
	
	return {
		marginRight: "8px",
		display: "flex",
		flexDirection: "column",
	};
};

export const messageRightGutterStyle = () => {
	return {
		flex: "1 1 0",
		minWidth: "0",
		padding: "8px",
		paddingLeft: "16px",
		margin: "-8px -8px -16px -16px",
	};
};

export const messageKitBlockStyle = props => {
	return {
		borderRadius: props.cornerRadius,
		padding: "8px 16px",
		background: props.backgroundColor,
		border: props.border,
	};
};

export const messageBlockStyle = props => {
	return {
		color: `${props.textColor}`,
		font: `${props.textFont}`,
		whiteSpace: "pre-wrap",
		wordWrap: "break-word",
		textAlign: "left",
		margin: "0",
		'.emoji': {
			width: "24px",
    		height: "24px",
			display: "inline-block"
		},
		// a: {
		// 	color: "inherit",
		// },
	};
};

export const emojiStyle = props => {
	return {
		width: "24px",
		height: "24px",
	};
}

export const messageAvatarStyle = () => {
	return {
		flexShrink: "0",
		position: "relative",
	};
};

export const messageSenderStyle = props => {
	return {
		color: props.usernameColor,
		font: props.usernameFont,
	};
};

export const messageKitReceiptStyle = props => {
	let justifyContent = { justifyContent: "flex-start" };
	if (props.messageAlignment === messageAlignment.standard && props.loggedInUser?.uid === props.messageObject?.sender?.uid) {
		justifyContent = { justifyContent: "flex-end" };
	}

	return {
		display: "flex",
		alignItems: "center",
		height: "24px",
		...justifyContent,
	};
};

export const messageTimestampStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		height: "24px",
	};
};
