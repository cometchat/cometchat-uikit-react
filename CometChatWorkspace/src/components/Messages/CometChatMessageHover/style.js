export const messageHoverStyle = props => {
	return {
		position: "absolute",
		zIndex: "1",
		display: "flex",
		listStyleType: "none",
		padding: "8px",
		margin: "0",
		height: "35px",
		border: `1px solid rgb(234, 234, 234)`,
		backgroundColor: `rgb(255, 255, 255)`,
		borderRadius: "4px",
		alignItems: "center",
		justifyContent: "center",
		...props.style,
	};
};