export const modalRowStyle = (theme) => {
	return {
		border: `1px solid ${theme.borderColor.primary}`,
		display: "flex",
		width: "100%",
		fontSize: "14px",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		"&:not(:last-child)": {
			borderBottom: "none",
		},
	};
};

export const modalColumnStyle = () => {
	return {
		padding: "8px",
		width: "calc(100% - 50px)",
	};
};

export const avatarStyle = () => {
	return {
		display: "inline-block",
		float: "left",
		width: "36px",
		height: "36px",
		marginRight: "8px",
	};
};

export const nameStyle = () => {
	return {
		margin: "10px",
		width: "calc(100% - 50px)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	};
};

export const selectionColumnStyle = () => {
	return {
		padding: "8px",
		width: "50px",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	};
};

export const selectionBoxStyle = (inactiveStateImg, activeStateImg, theme) => {
	return {
		display: "none",
		" + label": {
			display: "block",
			cursor: "pointer",
			userSelect: "none",
			padding: "8px",
			width: "100%",
			mask: `url(${inactiveStateImg}) center center no-repeat`,
			backgroundColor: `${theme.secondaryTextColor}`,
		},
		"&:checked + label": {
			width: "100%",
			mask: `url(${activeStateImg}) center center no-repeat`,
			backgroundColor: `${theme.secondaryTextColor}`,
		},
	};
};
