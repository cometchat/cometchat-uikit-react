export const listItem = (props) => {
	return {
		...props.style,
	};
};

export const listTitle = (props) => {
	return {
		margin: "0 6px",
		background: "transparent",
		textTransform: "capitalize",
		font: props.style.textFont,
		color: props.style.textColor,
		wordWrap: "break-word",
	};
};

export const listItemIconStyle = (props) => {
	return {
		WebkitMask: `url(${props.iconURL}) center center no-repeat`,
		background: props.style.iconBackground,
		transform: props.style.iconTransform,
		color: props.style.iconTint,
		marginLeft: "0px",
		width: "24px",
		height: "24px",
	};
};
