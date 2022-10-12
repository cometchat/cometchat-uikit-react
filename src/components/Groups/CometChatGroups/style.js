import { CometChatLocalize } from "../..";
import { fontHelper } from "../..";

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

export const createGroupBtnStyle = (style, createGroupIconURL, theme) => {
	const direction = CometChatLocalize.isRTL()
		? { left: "16px" }
		: { right: "16px" };
	return {
		WebkitMask: `url(${createGroupIconURL}) no-repeat left center`,
		backgroundColor: `${
			style.createGroupIconTint || theme?.palette?.getPrimary()
		}`,
		height: "24px",
		width: "24px",
		cursor: "pointer",
		position: "absolute",
		top: "20px",
		...direction,
	};
};

export const popOverForCreateGroup = (theme) => {
	return {
		width: "360px",
		height:"620px",
		position: "fixed",
		top: "50%",
		left: "50%",
		transform: "translate(-50%,-50%)",
		boxShadow: `0 0 32px ${theme?.palette?.getAccent300()}`,
	};
};

export const getCreateGroupStyle = (
	_createGroupConfiguration,
	theme
) => {
	return {
		width: _createGroupConfiguration.style.width || "100%",
		height: _createGroupConfiguration.style.height || "100%",
		background:
			_createGroupConfiguration.style.background ||
			theme.palette.getBackground(),
		border: _createGroupConfiguration.style.border || "none",
		borderRadius: _createGroupConfiguration.style.borderRadius || "8px",
		boxShadow:
			_createGroupConfiguration.style.boxShadow ||
			`${theme.palette.getAccent50()} 0px 0px 0px 1px`,
		closeIconTint:
			_createGroupConfiguration.style.closeIconTint ||
			theme.palette.getPrimary(),
		titleTextFont:
			_createGroupConfiguration.style.titleTextFont ||
			fontHelper(theme.typography.heading),
		titleTextColor:
			_createGroupConfiguration.style.titleTextColor ||
			theme.palette.getAccent(),
		errorTextBackground:
			_createGroupConfiguration.style.errorTextBackground ||
			"rgba(255, 59, 48, 0.1)",
		errorTextBorder: _createGroupConfiguration.style.errorTextBorder || "none",
		errorTextBorderRadius:
			_createGroupConfiguration.style.errorTextBorderRadius || "8px",
		errorTextColor:
			_createGroupConfiguration.style.errorTextColor ||
			theme.palette.getError(),
		errorTextFont:
			_createGroupConfiguration.style.errorTextFont ||
			fontHelper(theme.typography.text1),
		groupTypeTextFont:
			_createGroupConfiguration.style.groupTypeText ||
			fontHelper(theme.typography.text2),
		groupTypeTextColor:
			_createGroupConfiguration.style.groupTypeTextColor ||
			theme.palette.getAccent(),
		groupTypeTextBackground:
			_createGroupConfiguration.style.groupTypeBackground ||
			theme.palette.getAccent100(),
		groupTypeTextActiveBackground:
			_createGroupConfiguration.style.groupTypeTextActiveBackground ||
			theme.palette.getBackground(),
		namePlaceholderTextFont:
			_createGroupConfiguration.style.namePlaceholderTextFont ||
			fontHelper(theme.typography.subtitle1),
		namePlaceholderTextColor:
			_createGroupConfiguration.style.namePlaceholderTextColor ||
			theme.palette.getAccent(),
		nameInputBackground:
			_createGroupConfiguration.style.nameInputBackground ||
			theme.palette.getAccent50(),
		nameInputBorder: _createGroupConfiguration.style.nameInputBorder || "none",
		nameInputBorderRadius:
			_createGroupConfiguration.style.nameInputBorderRadius || "8px",
		nameInputBoxShadow:
			_createGroupConfiguration.style.nameInputBoxShadow ||
			`${theme.palette.getAccent50()} 0px 0px 0px 1px`,
		passwordPlaceholderTextFont:
			_createGroupConfiguration.style.passwordPlaceholderTextFont ||
			fontHelper(theme.typography.subtitle1),
		passwordPlaceholderTextColor:
			_createGroupConfiguration.style.passwordPlaceholderTextColor ||
			theme.palette.getAccent(),
		passwordInputBackground:
			_createGroupConfiguration.style.passwordInputBackground ||
			theme.palette.getAccent50(),
		passwordInputBorder:
			_createGroupConfiguration.style.passwordInputBorder || "none",
		passwordInputBorderRadius:
			_createGroupConfiguration.style.passwordInputBorderRadius || "8px",
		passwordInputBoxShadow:
			_createGroupConfiguration.style.passwordInputBoxShadow ||
			`${theme.palette.getAccent50()} 0px 0px 0px 1px`,
		createGroupButtonTextFont:
			_createGroupConfiguration.style.createGroupButtonTextFont ||
			fontHelper(theme.typography.title2),
		createGroupButtonTextColor:
			_createGroupConfiguration.style.createGroupButtonTextColor ||
			theme.palette.getAccent900("light"),
		createGroupButtonBackground: theme.palette.getPrimary(),
		createGroupButtonBorderRadius: "8px",
	};
};

export const getListBaseStyle = (style, theme) => {
	return {
		width: "100%",
		height: "100%",
		border: "0px none",
		cornerRadius: style?.cornerRadius,
		background:
			style.background || theme.palette.background[theme.palette.mode],
		titleFont: style?.titleFont || fontHelper(theme.typography.heading),
		titleColor: style?.titleColor || theme?.palette?.getAccent(),
		backIconTint: style?.backIconTint || theme?.palette?.getPrimary(),
		searchBorder:
			style?.searchBorder ||
			"1px solid " + theme.palette.accent50[theme.palette.mode],
		searchCornerRadius: style?.searchCornerRadius || "8px",
		searchBackground:
			style?.searchBackground || theme.palette.accent50[theme.palette.mode],
		searchTextColor:
			style?.searchTextColor || theme.palette.accent500[theme.palette.mode],
		searchIconTint:
			style?.searchIconTint || theme.palette.accent500[theme.palette.mode],
		searchTextFont: style?.searchTextFont || fontHelper(theme.typography.text1),
	};
};

export const getListStyle = (_groupListConfiguration, theme) => {
	return {
		width: _groupListConfiguration.style.width || "100%",
		height: _groupListConfiguration.style.height || "100%",
		background: _groupListConfiguration.style.background || "transparent",
		border: _groupListConfiguration.style.border || "0 none",
		borderRadius: _groupListConfiguration.style.borderRadius || "0",
		loadingIconTint:
			_groupListConfiguration.style.loadingIconTint ||
			theme.palette.accent600[theme.palette.mode],
		emptyTextFont:
			_groupListConfiguration.style.emptyTextFont ||
			fontHelper(theme.typography.heading),
		emptyTextColor:
			_groupListConfiguration.style.emptyTextColor ||
			theme.palette.accent400[theme.palette.mode],
		errorTextFont:
			_groupListConfiguration.style.errorTextFont ||
			fontHelper(theme.typography.heading),
		errorTextColor:
			_groupListConfiguration.style.errorTextColor ||
			theme.palette.accent400[theme.palette.mode],
	};
};
