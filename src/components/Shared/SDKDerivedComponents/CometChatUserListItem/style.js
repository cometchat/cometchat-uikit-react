export const listItem = (props, theme) => {

	let backgroundStyle = props.style.background;
	if (props.isActive) {
		backgroundStyle = props.style.activeBackground;
	}

	return {
		display: "flex",
		flexDirection: "row",
		justifyContent: "left",
		alignItems: "center",
		cursor: "pointer",
		width: props.style.width,
		height: props.style.height,
		padding: "8px 16px",
		background: backgroundStyle,
		borderRadius: props.style.borderRadius,
		"&:hover": {
			background: props.style.activeBackground,
		},
	};
};

export const itemThumbnailStyle = () => {
  return {
		position: "relative",
		display: "inline-block",
		flexShrink: "0",
		justifyContent: "center",
		alignItems: "center",
	};
};

export const itemDetailStyle = (props, theme) => {
  return {
		borderBottom: props.style.border || "1px solid " + theme.palette.accent200[theme.palette.mode],
		width: "calc(100% - 40px)",
		flexGrow: "1",
		marginLeft: "16px",
		"&[dir=rtl]": {
			marginRight: "16px",
			marginLeft: "0",
		},
		"&:hover": {
			borderBottom: props.style.border || "1px solid " + theme.palette.accent200[theme.palette.mode],
		},
	};
};

export const itemNameStyle = (props) => {
  return {
    font: props.style.titleFont,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    lineHeight: "22px",
    color: props.style.titleColor,
  };
};

export const itemDescStyle = (props) => {
  return {
    font: props.style.subtitleFont,
    color: props.style.subtitleColor,
    display: "flex",
    justifyContent: "left",
    alignItems: "center",
    width: "100%",
    letterSpacing: -1,
  };
};
