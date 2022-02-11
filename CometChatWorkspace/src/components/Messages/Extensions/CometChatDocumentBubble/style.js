import { messageAlignment } from "../../";

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
		borderRadius: props.cornerRadius,
		background: props.backgroundColor,
		border: props.border,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		padding: "16px",
	};
};

export const messageBlockStyle = props => {
	return {
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	};
};

export const messageIconStyle = props => {
	return {
		WebkitMask: `url(${props.iconURL}) no-repeat left center`,
		backgroundColor: `${props.iconTint}`,
		width: "24px",
		height: "24px",
		display: "inline-block",
	};
};

export const messageTxtStyle = props => {
	return {
		margin: "0",
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "calc(100% - 24px)",
		font: `${props.titleFont}`,
		color: `${props.titleColor}`,
		paddingLeft: "8px",
	};
};

export const messageBtnStyle = props => {
	return {
		width: "100%",
		listStyleType: "none",
		padding: "0",
		margin: "0",
	};
};

export const messageBtnItemStyle = props => {
	return {
		backgroundColor: `${props.buttonBackgroundColor}`,
		borderRadius: props.cornerRadius,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		position: "relative",
		margin: "16px 0 0 0",
		padding: "8px",
		cursor: "pointer",
	};
};

export const messageBtnItemTextStyle = props => {
	return {
		background: "0 0",
		textAlign: "center",
		color: `${props.buttonTextColor}`,
		width: "100%",
		font: `${props.buttonTextFont}`,
		display: "inline-block",
		margin: "0",
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

export const messageTitleStyle = props => {
	return {
		color: `${props.titleColor}`,
		font: `${props.titleFont}`,
	};
};

export const messageReplyReceiptStyle = props => {
	
	const position = (props.messageAlignment === messageAlignment.standard && props.loggedInUser?.uid === props.messageObject?.sender?.uid) ? {
		justifyContent: "flex-end",
	} : {
		justifyContent: "flex-start"
	}

	return {
		width: "100%",
		height: "24px",
		display: "flex",
		alignItems: "center",
		...position,
	};
};
