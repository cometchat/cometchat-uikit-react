import { fontHelper } from "../../..";
export const containerStyle = (style) => {
  return {
		width: style?.width,
		height: style?.height,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		border: style.border,
	};
};

export const getListBaseStyle = (style, theme) => {
	return {
		width: "100%",
		height: "100%",
		border: "0px none",
		borderRadius: style?.borderRadius,
		background: style?.background || theme?.palette?.getBackground(),
		titleColor: style?.titleColor || theme?.palette?.getAccent(),
		titleFont:
			style?.titleFont || fontHelper(theme?.typography?.heading),
		backIconTint: style?.backIconTint || theme?.palette?.getPrimary(),
		searchBorder: `1px solid ${theme?.palette?.getAccent50()}`,
		searchborderRadius: "8px",
		searchBackground:
			style?.searchBackground || theme?.palette?.getAccent50(),
		searchTextFont:
			style?.searchTextFont ||
			fontHelper(theme?.typography?.subtitle1),
		searchTextColor:
			style?.searchTextColor || theme?.palette?.getAccent500(),
		searchIconTint:
			style?.searchIconTint || theme?.palette?.getAccent500(),
	};
};

export const getListStyle = (_userListConfiguration,theme) => {
	return {
		width: _userListConfiguration.style?.width || "100%",
		height: _userListConfiguration.style?.height || "100%",
		border: _userListConfiguration.style?.border || "0 none",
		loadingIconTint:
			_userListConfiguration.style?.loadingIconTint ||
			theme?.palette?.getAccent600(),
		borderRadius: _userListConfiguration.style?.borderRadius || "0px",
		background: _userListConfiguration.style?.background || "transparent",
		emptyTextFont:
			_userListConfiguration.style?.emptyTextFont ||
			fontHelper(theme?.typography?.heading),
		emptyTextColor:
			_userListConfiguration.style?.emptyTextColor ||
			theme?.palette?.getAccent400(),
		errorTextFont:
			_userListConfiguration.style?.errorTextColor ||
			fontHelper(theme?.typography?.heading),
		errorTextColor:
			_userListConfiguration.style?.errorTextFont ||
			theme?.palette?.getAccent400(),
	};
};