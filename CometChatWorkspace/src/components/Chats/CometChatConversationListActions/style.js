export const conversationActionStyle = context => {
	return {
		display: "flex",
		listStyleType: "none",
		padding: "8px",
		margin: "0",
		width: "72px",
		backgroundColor: `${context.theme.backgroundColor.primary}`,
		borderRadius: "4px",
		alignItems: "center",
		justifyContent: "flex-end",
		position: "absolute",
		right: "16px",
		height: "100%",
	};
};

export const groupButtonStyle = (actionInProgress, progressIcon, actionIcon) => {

	const backgroundImage = actionInProgress ? progressIcon : actionIcon;

	return {
		outline: "0",
		border: "0",
		height: "24px",
		width: "24px",
		borderRadius: "4px",
		alignItems: "center",
		display: "inline-flex",
		justifyContent: "center",
		position: "relative",
		background: `url(${backgroundImage}) center center no-repeat`,
	};
};