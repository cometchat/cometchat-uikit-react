export const notificationContainerStyle = (props, keyframes) => {
	// const toastInRight = keyframes`
	// from {transform: translateX(100%);}
	// to {transform: translateX(0);}`;

	// const toastInLeft = keyframes`
	//     from {transform: translateX(-100%); }
	//     to {transform: translateX(0);}`;

	// let positionProp = {}
	// if (props.position === "top-right") {

	//     positionProp = {
	//         top: "12px",
	//         right: "12px",
	//         transition: "transform .6s ease-in",
	//         animation: `${toastInRight} .5s`
	//     };

	// } else if (props.position === "bottom-right") {

	//     positionProp = {
	//         bottom: "12px",
	//         right: "12px",
	//         transition: "transform .6s ease-in",
	//         animation: `${toastInRight} .5s`
	//     };

	// } else if (props.position === "top-left") {

	//     positionProp = {
	//         top: "12px",
	//         left: "12px",
	//         transition: "transform .6s ease-in",
	//         animation: `${toastInLeft} .5s`
	//     };

	// } else if (props.position === "bottom-left") {

	//     positionProp = {
	//         bottom: "12px",
	//         left: "12px",
	//         transition: "transform .6s ease-in",
	//         animation: `${toastInLeft} .5s`
	//     };
	// }

	return {
		fontSize: "14px",
		boxSizing: "border-box",
		position: "absolute",
		zIndex: "5",
		width: "80%",
		maxWidth: "320px",
		top: "70px",
		left: "50%",
		transform: "translate(-50%, 0)",
	};
};

export const notificationStyle = (props, state) => {
	let backgroundColorProp = {
		backgroundColor: "#000",
	};
	if (state.type === "ERROR") {
		backgroundColorProp = {
			backgroundColor: "#d9534f",
		};
	} else if (state.type === "SUCCESS") {
		backgroundColorProp = {
			backgroundColor: "#5cb85c",
		};
	} else if (state.type === "INFO") {
		backgroundColorProp = {
			backgroundColor: "#5bc0de",
		};
	} else if (state.type === "WARNING") {
		backgroundColorProp = {
			backgroundColor: "#f0ad4e",
		};
	}

	return {
		transition: ".3s ease",
		position: "relative",
		pointerEvents: "auto",
		overflow: "hidden",
		padding: "8px",
		marginBottom: "16px",
		fontSize: "13px",
		width: "100%",
		minHeight: "50px",
		boxShadow: "0 0 10px #999",
		color: "#fff",
		...backgroundColorProp,
		backgroundPosition: "15px",
		backgroundRepeat: "no-repeat",
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		boxSizing: "border-box",
	};
};

export const notificationIconStyle = () => {
	return {
		marginRight: "16px",
		width: "25px",
		height: "25px",
		flexShrink: "0",
		img: {
			maxWidth: "100%",
		},
	};
};

export const notificationMessageContainerStyle = () => {
	return {
		width: "calc(100% - 60px)",
	};
};

export const notificationMessageStyle = () => {
	return {
		margin: "0",
		textAlign: "left",
		marginLeft: "-1px",
	};
};

export const notificationCloseButtonStyle = () => {
	return {
		width: "25px",
		height: "25px",
		padding: "0",
		border: "none",
		outline: "none",
		backgroundColor: "transparent",
		cursor: " pointer",
		img: {
			flexShrink: "0",
			maxWidth: "100%",
		},
	};
};

export const iconStyle = (img, theme) => {
	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${theme.color.white}`,
	};
};
