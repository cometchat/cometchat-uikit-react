export const callScreenWrapperStyle = (props, keyframes) => {
	const fadeAnimation = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }`;

	return {
		width: "100%",
		height: "calc(100% - 50px)",
		position: "absolute",
		top: "50px",
		right: "0",
		bottom: "0",
		left: "0",
		backgroundColor: `${props.theme.backgroundColor.darkGrey}`,
		zIndex: "999",
		color: `${props.theme.color.white}`,
		textAlign: "center",
		boxSizing: "border-box",
		animation: `${fadeAnimation} 250ms ease`,
		fontFamily: `${props.theme.fontFamily}`,
		"*": {
			boxSizing: "border-box",
			fontFamily: `${props.theme.fontFamily}`,
		},
		iframe: {
			border: "none",
		},
	};
};

export const callScreenBackgroundStyle = (state) => {
	return {
		display: "none",
		width: "100vw",
		height: "100vh",
		position: "fixed",
		top: "0",
		left: "0",
		bottom: "0",
		right: "0",
		zIndex: "2147483001",
	};
};

export const callScreenContainerStyle = (props) => {
	return {
		width: props.maxWidth,
		height: props.maxHeight,
		position: "fixed",
		top: "0",
		left: "0",
		overflow: "hidden",
		zIndex: "2147483002",
		"*": {
			boxSizing: "border-box",
			fontFamily: `${props.theme.fontFamily}`,
		},
	};
};

export const callScreenInnerBackgroundStyle = () => {
	return {
		display: "none",
		position: "absolute",
		top: "0",
		left: "0",
		bottom: "0",
		right: "0",
		zIndex: "2147483003",
	};
};

export const callScreenHeaderStyle = (state) => {
	const cursorStyle = state.maximized
		? {}
		: {
				cursor: "grabbing",
		  };

	return {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		backgroundColor: "#282c34",
		width: "100%",
		height: "50px",
		position: "absolute",
		top: "0",
		right: "0",
		bottom: "0",
		left: "0",
		zIndex: "2147483004",
		...cursorStyle,
	};
};

export const headerTitleStyle = () => {
	return {
		width: "calc(100% - 55px)",
		padding: "16px",
	};
};

export const headerButtonStyle = () => {
	return {
		width: "55px",
		padding: "16px",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		button: {
			border: "none",
			background: "transparent",
			cursor: "pointer",
			outline: "none",
			display: "flex",
			flexDirection: "row",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			padding: "0px",
			userSelect: "none",
			img: {
				maxWidth: "100%",
				flexShrink: "0",
			},
		},
	};
};

export const callScreenResizerStyle = (state) => {
	const backgroundStyle = state.maximized
		? {
				display: "none",
		  }
		: {
				cursor: "nwse-resize",
				clipPath: "polygon(100% 0,100% 100%,0 100%)",
				background:
					"repeating-linear-gradient(135deg,hsla(0,0%,100%,.5),hsla(0,0%,100%,.5) 2px,#000 0,#000 4px)",
		  };

	return {
		width: "35px",
		height: "35px",
		position: "absolute",
		right: "0",
		bottom: "0",
		zIndex: "2147483004",
		...backgroundStyle,
	};
};

export const iconStyle = (img) => {
	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		cursor: "pointer",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `white`,
	};
};
