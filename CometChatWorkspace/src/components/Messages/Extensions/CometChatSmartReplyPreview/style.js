export const previewWrapperStyle = (context, keyframes) => {
	const slideAnimation = keyframes`
    from {
        bottom: -55px
    }
    to {
        bottom: 0px
    }`;

	return {
		padding: "8px 8px 16px 8px",
		marginBottom: "-8px",
		backgroundColor: `${context.theme.backgroundColor.white}`,
		border: `1px solid ${context.theme.borderColor.primary}`,
		fontSize: "13px",
		display: "flex",
		flexDirection: "row-reverse",
		justifyContent: "space-between",
		animation: `${slideAnimation} 0.5s ease-out`,
		position: "relative",
	};
};

export const previewHeadingStyle = () => {
	return {
		alignSelf: "flex-start",
		display: "flex",
		alignItems: "baseline",
		justifyContent: "space-between",
	};
};

export const previewCloseStyle = (img, context) => {
	return {
		width: "24px",
		height: "24px",
		borderRadius: "50%",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.primaryColor}`,
		cursor: "pointer",
	};
};

export const previewOptionsWrapperStyle = () => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-around",
		width: "100%",
	};
};

export const previewOptionStyle = (context) => {
	return {
		padding: "8px",
		margin: "0 8px",
		backgroundColor: `${context.theme.backgroundColor.grey}`,
		border: `1px solid ${context.theme.borderColor.primary}`,
		borderRadius: "10px",
		cursor: "pointer",
		height: "100%",
		textAlign: "center",
	};
};
