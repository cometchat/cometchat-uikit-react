export const messageHoverStyle = props => {
	return {
		width: "100%",
		height: "auto",
	};
};

export const messageActionsStyle = () => {
	return {
		position: "relative",
	};
};

export const messageGutterStyle = props => {

	const position = (props.messageListAlignment === "standard" && props.messageAlignment === "right") ? {
		justifyContent: "flex-end",
	} : {
		justifyContent: "flex-start"
	}

	return {
		padding: "8px 20px",
		display: "flex",
		width: "100%",
		".message_kit__reaction_bar": {
			...position,
		},
	};
};

export const messageLeftGutterStyle = props => {
	return {
		flexShrink: "0",
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
		padding: "0",
		border: props.border,
	};
};

export const messageBlockStyle = props => {
	return {
		margin: "0",
		maxWidth: props.width,
		height: props.height,
	};
};

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
	return {
		display: "flex",
		alignItems: "center",
		height: "24px",
	};
};

export const messageTimestampStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		height: "24px",
	};
};

export const messageReplyReceiptStyle = props => {
	const position =
		props.messageListAlignment === "standard" && props.messageAlignment === "right"
			? {
					justifyContent: "flex-end",
			  }
			: {
					justifyContent: "flex-start",
			  };

	return {
		width: "100%",
		height: "24px",
		display: "flex",
		alignItems: "center",
		...position,
	};
};
