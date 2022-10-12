import { fontHelper } from "../..";
export const groupListStyle = (style, theme) => {
	return {
		position: "relative",
		display: "flex",
		flexDirection: "column",
		width: style.width,
		height: style.height,
		overflowX: "hidden",
		overflowY: "auto",
		margin: "0",
		padding: "0",
		background: style?.background || theme?.palette?.getBackground(),
		border: style.border,
		borderRadius: style.borderRadius,
		...theme.globalStyles,
	};
};

export const groupMsgStyle = (style) => {
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

export const groupMsgTxtStyle = (style, theme, decoratorMessage) => {
	let color = { color: theme.palette.accent400[theme.palette.mode] };
	let font = { font: fontHelper(theme.typography.heading) };

	if (decoratorMessage.toLowerCase() === "no_groups_found") {
		if (style?.emptyTextColor) {
			color = { color: style.emptyTextColor };
		}

		if (style?.emptyTextFont) {
			font = { font: style.emptyTextFont };
		}
	} else if (decoratorMessage.toLowerCase() === "something_wrong") {
		color = { color: theme.palette.error[theme.palette.mode] };

		if (style?.errorTextColor) {
			color = { color: style.errorTextColor };
		}

		if (style?.errorTextFont) {
			font = { font: style.errorTextFont };
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

export const groupMsgImgStyle = (style, theme, loadingIconURL) => {
	let background = { background: theme.palette.accent600[theme.palette.mode] };
	if (style?.loadingIconTint) {
		background = { background: style.loadingIconTint };
	}
	return {
		WebkitMask: `url(${loadingIconURL}) center center no-repeat`,
		...background,
		margin: "0",
		height: "36px",
		wordWrap: "break-word",
		padding: "0 16px",
		width: "calc(100% - 32px)",
	};
};

export const listItemStyle = (theme) => {
	return {
		width: "100%",
		height: "auto",
		background: "transparent",
		activeBackground: theme?.palette?.getAccent50(),
		border: "1px solid " + theme?.palette?.accent200[theme?.palette?.mode],
		borderRadius: "0",
		titleColor: theme?.palette?.getAccent(),
		titleFont: fontHelper(theme?.typography?.title2),
		subtitleColor: theme?.palette?.getAccent600(),
		subtitleFont: fontHelper(theme?.typography?.subtitle2),
	};
};
