import { fontHelper } from "../../Shared";
export const messagePaneTopStyle = () => {
	return {
		top: "75px",
		position: "fixed",
		width: "auto",
		right: "auto",
		left: "50%",
		zIndex: "200",
		transform: "translateX(-50%)",
	};
};

export const messagePaneBannerStyle = (style, _theme) => {
	return {
		marginBottom: "0",
		display: "block",
		flex: "1",
		background: style.background || _theme.palette.primary[_theme.palette.mode],
		borderRadius: style.borderRadius,
		zIndex: 2,
	};
};

export const messagePaneUnreadBannerStyle = () => {
	return {
		height: "28px",
		display: "flex",
		flex: "1",
		alignItems: "center",
		background: "#39f",
		borderRadius: "6px",
	};
};

export const messagePaneUnreadBannerMessageStyle = (style, _theme) => {
	return {
		padding: "0 16px",
		flex: "1",
		textAlign: "center",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		textShadow: "0px 0px rgb(255, 255, 255)",
		border: style.border,
		font: style.textFont || fontHelper(_theme.typography.subtitle2),
		color: style.textColor || _theme.palette.background[_theme.palette.mode],
		background: style.background,
		borderRadius: style.borderRadius,
	};
};

export const iconArrowDownStyle = (style) => {
	return {
		position: "relative",
		display: "inline-flex",
		height: "20px",
		alignItems: "center",
		justifyContent: "center",
		paddingRight: "8px",
		color: style.iconColor,
	};
};
