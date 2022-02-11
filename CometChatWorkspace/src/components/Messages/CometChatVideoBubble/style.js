export const messageBackgroundStyle = props => {
	return {
		width: `${props.width}`,
		height: `${props.height}`,
		userSelect: "text",
	};
};

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
		padding: "0",
		borderRadius: props.cornerRadius,
		background: props.backgroundColor,
		border: props.border,
		height: props.height,
	};
};

export const messageBlockStyle = props => {
	return {
		margin: "0",
		maxWidth: props.width,
		height: props.height,
		borderRadius: "inherit",
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
