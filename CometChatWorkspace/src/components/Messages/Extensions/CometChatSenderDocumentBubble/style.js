export const messageContainerStyle = () => {
	return {
		alignSelf: "flex-end",
		marginBottom: "16px",
		paddingLeft: "16px",
		paddingRight: "16px",
		maxWidth: "305px",
		clear: "both",
		position: "relative",
		display: "flex",
		flexDirection: "column",
		flexShrink: "0",
	};
};

export const messageWrapperStyle = () => {
	return {
		width: "auto",
		flex: "1 1",
		alignSelf: "flex-end",
		display: "flex",
	};
};

export const messageTxtWrapperStyle = (context) => {
	return {
		display: "inline-block",
		borderRadius: "12px",
		backgroundColor: `${context.theme.primaryColor}`,
		color: `${context.theme.color.white}`,
		padding: "16px",
		alignSelf: "flex-end",
		width: "auto",
	};
};

export const messageTxtContainerStyle = () => {
	return {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	};
};

export const messageTxtStyle = () => {
	return {
		margin: "0",
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "calc(100% - 24px)",
		fontSize: "14px",
		marginLeft: "8px",
	};
};

export const iconStyle = (img, context) => {
	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.color.white}`,
	};
};

export const messageBtnStyle = (context) => {
	return {
		listStyleType: "none",
		padding: "0",
		margin: "0",
		width: "100%",
		li: {
			backgroundColor: `${context.theme.backgroundColor.white}`,
			borderRadius: "8px",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			position: "relative",
			margin: "16px 0 0 0",
			padding: "8px",
			cursor: "pointer",
			"> p": {
				background: "0 0",
				textAlign: "center",
				color: `${context.theme.primaryColor}`,
				width: "100%",
				fontWeight: "600",
				display: "inline-block",
				fontSize: "14px",
				margin: "0",
			},
		},
	};
};

export const messageInfoWrapperStyle = () => {
	return {
		alignSelf: "flex-end",
		display: "flex",
		justifyContent: "flex-end",
		alignItems: "center",
		padding: "4px 8px",
		height: "25px",
	};
};

export const messageReactionsWrapperStyle = () => {
	return {
		display: "flex",
		alignSelf: "flex-end",
		width: "100%",
		flexWrap: "wrap",
		justifyContent: "flex-end",
		minHeight: "36px",
	};
};
