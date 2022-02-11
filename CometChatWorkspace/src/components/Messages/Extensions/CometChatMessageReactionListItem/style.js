export const messageReactionsStyle = (props) => {

	return {
		font: props.textFont,
		padding: "4px 6px",
		margin: "0 4px 4px 0",
		display: "inline-flex",
		alignItems: "center",
		verticalAlign: "top",
		backgroundColor: `${props.background}`,
		borderRadius: "12px",
		cursor: "pointer",
		border: props.border,
		".emoji-mart-emoji": {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
		},
		"&:hover": {
			border: props.border,
		},
	};
};

export const reactionCountStyle = props => {
	return {
		color: `${props.textColor}`,
		padding: "0 1px 0 3px",
	};
};