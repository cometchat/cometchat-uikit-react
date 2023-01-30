export const removeOptionIconStyle = (img, context) => {
	return {
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.color.red}`,
		cursor: "pointer",
		display: "block",
		height: "24px",
		width: "24px",
	};
};

export const iconWrapperStyle = () => {
	return {
		width: "50px",
	};
};
