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
		borderRadius: props.cornerRadius,
		padding: "8px 16px",
		background: props.backgroundColor,
		display: "flex",
		width: "100%",
		border: props.border,
	};
};

export const messageBlockStyle = props => {
	return {
		width: "calc(100% - 24px)",
		whiteSpace: "pre-wrap",
		wordWrap: "break-word",
		textAlign: "left",
		margin: "0 8px 0 0",
	};
};

export const messageTitleStyle = props => {
	return {
		color: `${props.titleColor}`,
		font: `${props.titleFont}`,
	};
};

export const messageTitleLinkStyle = props => {
	return {
		color: `${props.titleColor}`,
		font: `${props.titleFont}`,
	};
}

export const messageSubTitleStyle = props => {
	return {
		color: `${props.subTitleColor}`,
		font: `${props.subTitleFont}`,
	};
};

export const messageFileStyle = props => {
	return {
		width: "24px",
		margin: "8px 0",
	};
};

export const messageFileIconStyle = (props) => {
	return {
		mask: `url(${props.iconURL}) center center no-repeat`,
		backgroundColor: `${props.iconTint}`,
		display: "inline-block",
		width: "24px",
		height: "24px",
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
