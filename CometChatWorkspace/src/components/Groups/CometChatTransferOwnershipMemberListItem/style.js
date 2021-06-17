export const modalRowStyle = (props, context) => {
	return {
		display: "flex",
		width: "100%",
		fontSize: "14px",
		padding: "8px",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		borderLeft: `1px solid ${context.theme.borderColor.primary}`,
		borderRight: `1px solid ${context.theme.borderColor.primary}`,
		borderBottom: `1px solid ${context.theme.borderColor.primary}`,
	};
};

export const modalColumnStyle = context => {

	const mq = context.theme.breakPoints.map(x => `@media ${x}`);
	return {
		width: "calc(100% - 180px)",
		[mq[1]]: {
			width: "calc(100% - 140px)",
		},
		[mq[2]]: {
			width: "calc(100% - 180px)",
		},
		[mq[3]]: {
			width: "calc(100% - 120px)",
		},
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

export const selectionColumnStyle = context => {

	const mq = context.theme.breakPoints.map(x => `@media ${x}`);
	return {
		width: "180px",
		display: "flex",
		justifyContent: "flex-start",
		alignItems: "center",
		"span": {
			fontSize: "12px",
			display: "block",
		},
		[mq[1]]: {
			width: "140px",
		},
		[mq[2]]: {
			width: "180px",
		},
		[mq[3]]: {
			width: "120px",
		},
	};

};

export const selectionBoxStyle = (inactiveStateImg, activeStateImg) => {
	return {
		display: "none",
		" + label": {
			display: "block",
			cursor: "pointer",
			background: `url(${inactiveStateImg}) right center / 16px no-repeat`,
			userSelect: "none",
			float: "right",
			padding: "8px",
		},
		"&:checked + label": {
			background: `url(${activeStateImg}) no-repeat right center`,
			backgroundSize: "16px",
		},
	};
};
