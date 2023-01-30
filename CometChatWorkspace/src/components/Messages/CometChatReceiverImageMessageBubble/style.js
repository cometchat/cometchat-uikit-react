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
		width: "auto",
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

export const messageImgContainerStyle = () => {
	return {
		width: "auto",
		flex: "1 1",
		alignSelf: "flex-start",
		display: "flex",
	};
};

export const messageImgWrapperStyle = (context) => {
	const mq = [...context.theme.breakPoints];

	return {
		display: "inline-block",
		alignSelf: "flex-start",
		maxWidth: "300px",
		height: "200px",
		cursor: "pointer",
		img: {
			borderRadius: "8px",
			height: "100%",
		},
		[`@media ${mq[1]}, ${mq[2]}`]: {
			minWidth: "50px",
			maxWidth: "150px",
			height: "100px",
			padding: "2px 2px",
		},
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
