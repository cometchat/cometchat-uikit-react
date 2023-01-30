export const messageContainerStyle = () => {
	return {
		alignSelf: "flex-end",
		marginBottom: "16px",
		paddingLeft: "16px",
		paddingRight: "16px",
		maxWidth: "65%",
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
		padding: "8px 16px",
		alignSelf: "flex-end",
		width: "auto",
	};
};

export const pollQuestionStyle = () => {
	return {
		margin: "0",
		whiteSpace: "pre-wrap",
		wordWrap: "break-word",
		textAlign: "left",
		width: "100%",
		fontSize: "14px",
	};
};

export const pollAnswerStyle = (context) => {
	return {
		listStyleType: "none",
		padding: "0",
		margin: "0",
		width: "100%",
		li: {
			backgroundColor: `${context.theme.backgroundColor.white}`,
			margin: "10px 0",
			borderRadius: "8px",
			display: "flex",
			width: "100%",
			position: "relative",
		},
	};
};

export const pollTotalStyle = () => {
	return {
		fontSize: "13px",
		margin: "0",
		alignSelf: "flex-end",
	};
};

export const pollPercentStyle = (context, width) => {
	const curvedBorders =
		width === "100%"
			? { borderRadius: "8px" }
			: {
					borderRadius: "8px 0 0 8px",
			  };

	return {
		maxWidth: "100%",
		width: width,
		...curvedBorders,
		backgroundColor: `${context.theme.backgroundColor.primary}`,
		minHeight: "35px",
		height: "100%",
		position: "absolute",
		zIndex: "1",
	};
};

export const answerWrapperStyle = (context, width) => {
	return {
		width: "100%",
		color: `${context.theme.color.primary}`,
		display: "flex",
		alignItems: "center",
		minHeight: "35px",
		padding: "0 16px",
		height: "100%",
		zIndex: "2",
		p: {
			margin: "0",
			width: "calc(100% - 40px)",
			whiteSpace: "pre-wrap",
			wordWrap: "break-word",
			fontSize: "14px",
		},
		span: {
			maxWidth: "40px",
			padding: "0px 16px 0px 0px",
			fontWeight: "bold",
			display: "inline-block",
			fontSize: "13px",
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
