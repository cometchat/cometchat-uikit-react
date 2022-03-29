export const groupListStyle = (props, theme) => {
	return {
		position: "relative",
		display: "flex",
		flexDirection: "column",
		width: props.style.width,
		height: props.style.height,
		overflowX: "hidden",
		overflowY: "auto",
		margin: "0",
		padding: "0",
		background: props?.style?.background || theme?.palette?.background[theme?.palette?.mode],
		border: props.style.border,
		borderRadius: props.style.cornerRadius,
		...theme.globalStyles,
	};
};


export const groupMsgStyle = props => {
	return {
		overflow: "hidden",
		width: props.style.width,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		top: "50%",
	};
};

export const groupMsgTxtStyle = (props, fontStyle, theme, decoratorMessage) => {

  let color = { color: theme.palette.accent400[theme.palette.mode] };
  let font = { font: fontStyle(theme.typography.heading) };

  if (decoratorMessage.toLowerCase() === "no_groups_found") {

    if (props.style?.emptyTextColor) {
			color = { color: props.style.emptyTextColor };
		}

    if (props.style?.emptyTextFont) {
			font = { font: props.style.emptyTextFont };
		}
  } else if (decoratorMessage.toLowerCase() === "something_wrong") {

    color = { color: theme.palette.error[theme.palette.mode] };

    if (props.style?.errorTextColor) {
			color = { color: props.style.errorTextColor };
		}

    if (props.style?.errorTextFont) {
			font = { font: props.style.errorTextFont };
		}
  }

  return {
    display: "flex",
    justifyContent: "center",
    margin: "0",
    minHeight: "36px",
    ...color,
    ...font,
    wordWrap: "break-word",
    padding: "0 16px",
    width: "calc(100% - 32px)",
  };
};

export const groupMsgImgStyle = (props, theme) => {
  let background = { background: theme.palette.accent600[theme.palette.mode] };
  if (props.style?.loadingIconTint) {
    background = { background: props.style.loadingIconTint };
  }
  return {
    WebkitMask: `url(${props.loadingIconURL}) center center no-repeat`,
    ...background,
    margin: "0",
    height: "36px",
    wordWrap: "break-word",
    padding: "0 16px",
    width: "calc(100% - 32px)",
  };
};