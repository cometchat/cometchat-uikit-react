export const messageContainerStyle = () => {
	return {
		alignSelf: "flex-start",
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
		width: "100%",
		flex: "1 1",
		alignSelf: "flex-start",
		display: "flex",
	};
};

export const messageThumbnailStyle = () => {
	return {
		width: "36px",
		height: "36px",
		margin: "10px 5px",
		float: "left",
		flexShrink: "0",
	};
};

export const messageDetailStyle = () => {
	return {
		flex: "1 1",
		display: "flex",
		flexDirection: "column",
		width: "calc(100% - 36px)",
	};
};

export const nameWrapperStyle = (avatar) => {
	const paddingValue = avatar
		? {
				padding: "3px 5px",
		  }
		: {};

	return {
		alignSelf: "flex-start",
		...paddingValue,
	};
};

export const nameStyle = (context) => {
	return {
		fontSize: "11px",
		color: `${context.theme.color.search}`,
	};
};

export const messageTxtContainerStyle = () => {
	return {
		width: "auto",
		flex: "1 1",
		alignSelf: "flex-start",
		display: "flex",
	};
};

export const messageTxtWrapperStyle = (context) => {
	return {
		display: "flex",
		flexDirection: "column",
		borderRadius: "12px",
		backgroundColor: `${context.theme.backgroundColor.secondary}`,
		padding: "8px 16px",
		alignSelf: "flex-start",
		width: "100%",
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
		li: {
			backgroundColor: `${context.theme.backgroundColor.white}`,
			margin: "10px 0",
			borderRadius: "8px",
			display: "flex",
			width: "100%",
			cursor: "pointer",
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

export const answerWrapperStyle = (state, optionData, context) => {
	let countPadding = "0px 16px 0px 0px";
	let widthProp = "calc(100% - 40px)";
	if (
		optionData.hasOwnProperty("voters") &&
		optionData.voters.hasOwnProperty(state?.loggedInUser?.uid)
	) {
		//countPadding = "0px 8px";
		widthProp = "calc(100% - 80px)";
	}

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
			width: widthProp,
			whiteSpace: "pre-wrap",
			wordWrap: "break-word",
			fontSize: "14px",
		},
		span: {
			width: "40px",
			padding: countPadding,
			fontWeight: "bold",
			display: "inline-block",
			fontSize: "13px",
		},
	};
};

export const checkIconStyle = (img, context) => {
	return {
		width: "40px",
		height: "24px",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.secondaryTextColor}`,
	};
};

export const messageInfoWrapperStyle = () => {
	return {
		alignSelf: "flex-start",
		padding: "4px 8px",
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		height: "25px",
	};
};

export const messageReactionsWrapperStyle = () => {
	return {
		display: "flex",
		alignSelf: "flex-start",
		width: "100%",
		flexWrap: "wrap",
		justifyContent: "flex-start",
		minHeight: "36px",
	};
};
