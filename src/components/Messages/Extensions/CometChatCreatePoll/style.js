export const modalWrapperStyle = () => {

	return {
		minWidth: "360px",
		minHeight: "620px",
		height: "40%",
		overflow: "hidden",
		backgroundColor: `#fff`,
		position: "fixed",
		left: "50%",
		top: "50%",
		transform: "translate(-50%, -50%)",
		zIndex: "1002",
		margin: "0 auto",
		boxShadow: "rgba(20, 20, 20, 0.2) 0 16px 32px, rgba(20, 20, 20, 0.04) 0 0 0 1px",
		borderRadius: "12px",
		display: "block",
	};
};

export const modalCloseStyle = (props) => {

	return {
		position: "absolute",
		width: "32px",
		height: "32px",
		borderRadius: "50%",
		top: "16px",
		right: "16px",
		webkitMask: `url(${props.closeIconURL}) center center no-repeat`,
		backgroundColor: "RGB(51, 153, 255)",
		cursor: "pointer",
	}
}

export const modalBodyStyle = () => {

	return {
		padding: "24px",
		height: "100%",
		width: "100%"
	}
}

export const modalErrorStyle = () => {

	return {
		fontSize: "12px",
		color: `red`,
		textAlign: "center",
		margin: "8px 0",
		width: "100%",
	}
}

export const modalTableStyle = () => {

	return {
		borderCollapse: "collapse",
		margin: "0",
		padding: "0",
		width: "100%",
		height: "90%",
		tr: {
			borderBottom: `1px solid #39f`,
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
		textAlign: "center",
	}
}

export const tableBodyStyle = () => {

	return {
		height: "calc(100% - 40px)",
		overflowY: "auto",
		display: "block",
		"tr": {
			"td": {
				padding: "8px 16px",
				fontSize: "14px",
				"input": {
					width: "100%",
					border: "none",
					padding: "8px 16px",
					fontSize: "14px",
					"&:focus": {
						outline: "none"
					}
				},
				"label": {
					padding: "8px 16px",
				},
				":first-of-type": {
					width: "120px"
				}
			}
		}
	}
}


export const tableFootStyle = (isCreating, img) => {
	let loadingState = {};
	let textMargin = {};

	if (isCreating) {
		loadingState = {
			disabled: "true",
			pointerEvents: "none",
			background: `url(${img}) no-repeat right 10px center #39f`,
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
					backgroundColor: `#39f`,
					borderRadius: "5px",
					color: `#fff`,
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
		width: "30px"
	}
}

export const addOptionIconStyle = (img) => {

	return {
		backgroundSize: "28px 28px",
		cursor: "pointer",
		display: "block",
		height: "24px",
		width: "40px",
		WebkitMask: `url(${img}) center center no-repeat`,
		background: ` RGB(51, 153, 255)`,
	}
}
export const addItemStyle = () => {

	return {
		width: "360px",
		height: "28px",
		padding: '30px 0px 0px 0px',
		font: "1px",
		color: "RGB(51, 153, 255)"
	}
}
export const answersStyle = () => {

	return {

		padding: '6px'
	}
}
export const pollQuestionStyle = (props) => {

	return {
		width: props.style.width,
		height: props.style.height,
		borderRadius: props.style.borderRadius,
		border: props.style.border,
		background: props.style.background,
		padding: "10px",
		font: "15px",
	}
}
export const pollOptionStyle = (props) => {
	return {
		width: props.style.width,
		height: props.style.height,
		borderRadius: props.style.borderRadius,
		border: props.style.border,
		background: props.style.background,
		padding: "10px",
		font: "15px"
	}
}
export const sendButtonStyle = (props) => {

	return {
		width: props.style.width,
		height: props.style.height,
		borderRadius: "15px",
		border: props.style.border,
		background: "RGB(51, 153, 255)",
		//padding: "10px",
		font: "15px",
		color: "white",
		textAlign: "center"
	}
}
export const tableStyle = (props) => {

	return {
		width: props.style.width,
		height: "28px",
		padding: '30px 8px 6px 0px',
		font: "15px",
		color: "RGBA(20, 20, 20, 0.46)"
	}
}