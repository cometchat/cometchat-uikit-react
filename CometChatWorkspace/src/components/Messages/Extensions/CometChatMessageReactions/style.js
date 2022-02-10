export const messageReactionListStyle = props => {
	return {
		padding: "4px 0",
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start"
	}
}

export const messageAddReactionStyle = (props) => {

	return {
		font: props.textFont,
		padding: "4px 6px",
		display: "inline-flex",
		alignItems: "center",
		verticalAlign: "top",
		background: `${props.background}`,
		borderRadius: "12px",
		cursor: "pointer",
		border: "1px solid transparent",
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

export const emojiButtonStyle = (img, props) => {

	return {
		outline: "0",
		border: "0",
		borderRadius: "4px",
		alignItems: "center",
		display: "inline-flex",
		justifyContent: "center",
		position: "relative",
		i: {
			height: "20px",
			width: "20px",
			mask: `url(${img}) center center no-repeat`,
			backgroundColor: "#808080",
		},
	};
};