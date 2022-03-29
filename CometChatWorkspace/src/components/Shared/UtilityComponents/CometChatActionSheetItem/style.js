export const actionSheetItemWrapperStyle = props => {
	return {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		background: props.background,
		padding: "8px 16px",
		width: props.width,
		height: props.height,
		overflowX: "hidden",
		overflowY: "auto",
		cursor: "pointer",
		...props.style
	};
};

export const IconBackgroundStyle = props => {
	return {
		width: "38px",
		height: "38px",
		borderRadius: "50%",
		background: props.iconBackground,
		cursor: "pointer",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	};
};

export const IconStyle = props => {
	return {
		width: "24px",
		height: "24px",
		WebkitMask: `url(${props.iconURL}) center center no-repeat`,
		backgroundColor: props.iconTint,
		flexShrink: "0",
		display: "inline-block",
	};
};

export const actionSheetItemTitleStyle = props => {
	return {
		font: props.titleFont,
		color: props.titleColor,
		wordBreak: "break-word",
		margin: "6px",
	};
};
