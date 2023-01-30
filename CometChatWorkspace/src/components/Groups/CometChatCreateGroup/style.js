export const modalWrapperStyle = (context) => {
	const mq = context.theme.breakPoints.map((x) => `@media ${x}`);
	return {
		minWidth: "350px",
		minHeight: "350px",
		width: "40%",
		height: "40%",
		overflow: "hidden",
		backgroundColor: `${context.theme.backgroundColor.white}`,
		position: "fixed",
		left: "50%",
		top: "50%",
		transform: "translate(-50%, -50%)",
		zIndex: "4",
		margin: "0 auto",
		boxShadow:
			"rgba(20, 20, 20, 0.2) 0 16px 32px, rgba(20, 20, 20, 0.04) 0 0 0 1px",
		borderRadius: "12px",
		display: "block",
		[mq[0]]: {
			width: "100%",
			height: "100%",
		},
		[mq[1]]: {
			width: "100%",
			height: "100%",
		},
		[mq[2]]: {
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

export const modalErrorStyle = (context) => {
	return {
		fontSize: "12px",
		color: `${context.theme.color.red}`,
		textAlign: "center",
		margin: "8px 0",
		width: "100%",
	};
};

export const modalTableStyle = (props) => {
	return {
		borderCollapse: "collapse",
		margin: "0",
		padding: "0",
		width: "100%",
		height: "90%",
		tr: {
			display: "table",
			width: "100%",
			tableLayout: "fixed",
		},
	};
};

export const tableCaptionStyle = () => {
	return {
		fontSize: "20px",
		marginBottom: "15px",
		fontWeight: "bold",
		textAlign: "left",
	};
};

export const tableBodyStyle = () => {
	return {
		height: "calc(100% - 40px)",
		overflowY: "auto",
		display: "block",
		tr: {
			td: {
				padding: "8px 0",
				fontSize: "14px",
				input: {
					width: "100%",
					border: "none",
					padding: "8px 16px",
					fontSize: "14px",
					outline: "none",
				},
				select: {
					outline: "none",
					padding: "8px 16px",
				},
			},
		},
	};
};

export const tableFootStyle = (context, state, img) => {
	const loadingState = state.creatingGroup
		? {
				disabled: "true",
				pointerEvents: "none",
				background: `url(${img}) no-repeat right 10px center ${context.theme.primaryColor}`,
		  }
		: {};

	const textMargin = state.creatingGroup ? { marginRight: "24px" } : {};

	return {
		display: "inline-block",
		button: {
			cursor: "pointer",
			padding: "8px 16px",
			backgroundColor: `${context.theme.primaryColor}`,
			borderRadius: "5px",
			color: `${context.theme.color.white}`,
			fontSize: "14px",
			outline: "0",
			border: "0",
			...loadingState,
			span: {
				...textMargin,
			},
		},
		tr: {
			border: "none",
			td: {
				textAlign: "center",
			},
		},
	};
};

export const inputStyle = (context) => {
	return {
		display: "block",
		width: "100%",
		border: "0",
		boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
		borderRadius: "8px",
		backgroundColor: `${context.theme.backgroundColor.grey}`,
		color: `${context.theme.color.helpText}`,
		fontSize: "14px",
	};
};
