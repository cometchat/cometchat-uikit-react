export const actionWrapperStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		listStyleType: "none",
		padding: "8px",
		margin: "0",
		background: "transparent",
		borderRadius: "4px",
		...props.style
	};
};

export const deleteActionStyle = deleteIcon => {

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
		background: `url(${deleteIcon}) center center no-repeat`,
	};
};