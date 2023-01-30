export const modalWrapperStyle = (props, context) => {
	const mq = [`@media (min-width : 320px) and (max-width: 767px)`];
	return {
		minWidth: "350px",
		minHeight: "450px",
		width: "40%",
		height: "40%",
		overflow: "hidden",
		backgroundColor: `${context.theme.backgroundColor.white}`,
		position: "fixed",
		left: "50%",
		top: "50%",
		transform: "translate(-50%, -50%)",
		zIndex: "1002",
		margin: "0 auto",
		boxShadow:
			"rgba(20, 20, 20, 0.2) 0 16px 32px, rgba(20, 20, 20, 0.04) 0 0 0 1px",
		borderRadius: "12px",
		display: "block",
		[mq[0]]: {
			width: "100%",
			height: "100%",
		},
	};
};

export const modalCloseStyle = (img, context) => {
	return {
		position: "absolute",
		width: "32px",
		height: "32px",
		borderRadius: "50%",
		top: "16px",
		right: "16px",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.primaryColor}`,
		cursor: "pointer",
	};
};

export const modalBodyStyle = () => {
	return {
		padding: "24px",
		height: "100%",
		width: "100%",
	};
};

export const modalCaptionStyle = (dir) => {
	const textAlignStyle =
		dir === "rtl"
			? {
					textAlign: "right",
					paddingRight: "32px",
			  }
			: {
					textAlign: "left",
			  };

	return {
		fontSize: "20px",
		marginBottom: "8px",
		fontWeight: "bold",
		...textAlignStyle,
		width: "100%",
	};
};

export const modalErrorStyle = (context) => {
	return {
		fontSize: "12px",
		color: `${context.theme.color.red}`,
		textAlign: "center",
		padding: "8px 0",
		height: "31px",
		width: "100%",
	};
};

export const modalListStyle = (context) => {
	return {
		width: "100%",
		height: "calc(100% - 120px)",
		display: "flex",
		flexDirection: "column",
		justifyContent: "flex-start",
		alignItems: "flex-start",
	};
};

export const listHeaderStyle = (context) => {
	return {
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		fontWeight: "bold",
		padding: "8px",
		width: "100%",
		border: `1px solid ${context.theme.borderColor.primary}`,
	};
};

export const listStyle = () => {
	return {
		display: "flex",
		flexDirection: "column",
		justifyContent: "flex-start",
		alignItems: "flex-start",
		width: "100%",
		height: "calc(100% - 100px)",
		overflowY: "auto",
	};
};

export const nameColumnStyle = (props, context) => {
	const mq = context.theme.breakPoints.map((x) => `@media ${x}`);
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

export const scopeColumnStyle = (context) => {
	const mq = context.theme.breakPoints.map((x) => `@media ${x}`);
	return {
		width: "180px",
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

export const modalFootStyle = (state, context, img) => {
	const btnState =
		!state.newGroupOwner || state.transferringOwnership
			? {
					disabled: "true",
					pointerEvents: "none",
			  }
			: {};

	const loadingState = state.transferringOwnership
		? {
				background: `url(${img}) no-repeat right 10px center ${context.theme.backgroundColor.blue}`,
		  }
		: {};

	const textMargin = state.transferringOwnership ? { marginRight: "24px" } : {};

	return {
		paddingTop: "24px",
		textAlign: "center",
		button: {
			cursor: "pointer",
			padding: "8px 16px",
			backgroundColor: `${context.theme.backgroundColor.blue}`,
			borderRadius: "5px",
			color: `${context.theme.color.white}`,
			fontSize: "14px",
			outline: "0",
			border: "0",
			...btnState,
			...loadingState,
			span: {
				...textMargin,
			},
		},
	};
};
