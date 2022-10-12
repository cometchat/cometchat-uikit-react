import { fontHelper } from "../../Shared";
export const contactListStyle = (style, theme) => {
	return {
		position: "relative",
		display: "flex",
		flexDirection: "column",
		width: style.width,
		height: style.height,
		overflowX: "hidden",
        overflowY: "scroll",
        margin: "0",
		padding: "0",
		background: style?.background || theme?.palette?.getBackground(),
    	border: style.border,
		borderRadius: style.borderRadius,
		...theme.globalStyles,
	};
};


export const contactMsgStyle = (style) => {
  return {
    overflow: "hidden",
    width: style.width,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
  };
};

export const contactMsgTxtStyle = (style, theme, decoratorMessage, fontHelper) => {

	let color = { color: theme.palette.accent400[theme.palette.mode] };
	let font = { font: fontHelper(theme.typography.heading) };

	if (decoratorMessage && decoratorMessage.toLowerCase() === "no_users_found") {

    	if (style?.emptyTextColor) {
			color = { color: style.emptyTextColor };
		}

		if (style?.emptyTextFont) {
			font = { font: style.emptyTextFont };
		}

	} else if (decoratorMessage && decoratorMessage.toLowerCase() === "something_wrong") {

    	color = { color: theme.palette.error[theme.palette.mode] };

		if (style?.errorTextColor) {
			color = { color: style?.errorTextColor };
		}

		if (style?.errorTextFont) {
			font = { font: style?.errorTextFont };
		}

	}

	return {
		display: "flex",
		justifyContent: "center",
		margin: "0",
		minHeight: "36px",
		lineHeight: "30px",
		wordWrap: "break-word",
		padding: "0 16px",
		width: "calc(100% - 32px)",
		...color,
		...font,
	};
};

export const contactMsgImgStyle = (style,loadingIconURL, theme) => {

  	let background = { background: theme.palette.accent600[theme.palette.mode] };
  	if (style?.loadingIconTint) {
		background = { background: style?.loadingIconTint };
	}

	return {
		WebkitMask: `url(${loadingIconURL}) center center no-repeat`,
		...background,
		margin: "0",
		minHeight: "36px",
		lineHeight: "30px",
		wordWrap: "break-word",
		padding: "0 16px",
		width: "100%",
	};
};

export const contactAlphabetStyle = (theme) => {
  return {
    padding: "0 20px",
    margin: "8px 0",
    width: "calc(100% - 40px)",
    color: theme?.palette?.getAccent500(),
  };
};

export const listItemStyle = (theme) => {
	return {
		width: "100%",
		height: "auto",
		background: "transparent",
		activeBackground: theme?.palette?.getAccent50(),
		border: `1px solid ${theme.palette.accent200[theme.palette.mode]}`,
		borderRadius: "0",
		titleColor: theme?.palette?.accent[theme?.palette?.mode],
		titleFont: fontHelper(theme?.typography?.title2),
		subtitleColor: theme.palette.accent400[theme?.palette?.mode],
		subtitleFont: fontHelper(theme?.typography?.subtitle2),
	};
};