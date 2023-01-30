export const msgTimestampStyle = (context, props, loggedInUser) => {
	return {
		display: "flex",
		fontSize: "11px",
		fontWeight: "500",
		lineHeight: "12px",
		textTransform: "uppercase",
		color: `${context.theme.color.search}`,
	};
};

export const iconStyle = (img, color) => {
	return {
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${color}`,
		display: "inline-block",
		width: "24px",
		height: "24px",
	};
};
