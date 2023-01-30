export const modalWrapperStyle = (context) => {
	const mq = [...context.theme.breakPoints];

	return {
		minWidth: "350px",
		minHeight: "450px",
		width: "50%",
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
		[`@media ${mq[1]}, ${mq[2]}`]: {
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

export const modalTableStyle = (context) => {
	return {
		borderCollapse: "collapse",
		margin: "0",
		padding: "0",
		width: "100%",
		height: "90%",
		tr: {
			borderBottom: `1px solid ${context.theme.borderColor.primary}`,
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
				padding: "8px 16px",
				fontSize: "14px",
				input: {
					width: "100%",
					border: "none",
					padding: "8px 16px",
					fontSize: "14px",
					"&:focus": {
						outline: "none",
					},
				},
				label: {
					padding: "8px 16px",
				},
				":first-of-type": {
					width: "120px",
				},
			},
		},
	};
};

export const tableFootStyle = (context, state, img) => {
	let loadingState = {};
	let textMargin = {};

	if (state.creatingPoll) {
		loadingState = {
			disabled: "true",
			pointerEvents: "none",
			background: `url(${img}) no-repeat right 10px center ${context.theme.primaryColor}`,
		};

		textMargin = {
			marginRight: "24px",
		};
	}

	return {
		display: "inline-block",
		tr: {
			border: "none",
			td: {
				textAlign: "center",
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
			},
		},
	};
};

export const iconWrapperStyle = () => {
	return {
		width: "50px",
	};
};

export const addOptionIconStyle = (img, context) => {
	return {
		backgroundSize: "28px 28px",
		cursor: "pointer",
		display: "block",
		height: "24px",
		width: "24px",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.secondaryTextColor}`,
	};
};
