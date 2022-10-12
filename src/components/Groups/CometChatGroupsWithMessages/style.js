import { fontHelper } from "../../Shared";
export const chatScreenStyle = (style) => {
	return {
		display: "flex",
		height: "100vh",
		width: "100vw",
		border: `none `,
		...style,
	};
};

export const joinProtectedGroupStyles = (
	theme,
	joinGroupConfiguration
) => {
	return {
		width: joinGroupConfiguration?.style?.width || "100%",
		height:joinGroupConfiguration?.style?.height || "100%",
		boxShadow:joinGroupConfiguration?.style?.boxShadow || `${theme?.palette?.getAccent50()} 0px 0px 0px 1px`,
		background:joinGroupConfiguration?.style?.background || theme.palette.getBackground(),
		border: joinGroupConfiguration?.style?.border ||"none",
		borderRadius:joinGroupConfiguration?.style?.borderRadius || "0px",
		titleTextFont: joinGroupConfiguration?.style?.titleTextFont || fontHelper(theme?.typography?.heading),
		titleTextColor:joinGroupConfiguration?.style?.titleTextColor ||  theme.palette.getAccent700(),
		errorTextFont:joinGroupConfiguration?.style?.errorTextFont ||  fontHelper(theme.typography.text1),
		errorTextColor: joinGroupConfiguration?.style?.errorTextColor || theme.palette.getError(),
		passwordTextFont:joinGroupConfiguration?.style?.passwordTextFont ||  fontHelper(theme.typography.subtitle2),
		passwordTextColor:joinGroupConfiguration?.style?.passwordTextColor ||  theme.palette.getAccent900(),
		passwordPlaceholderTextFont:joinGroupConfiguration?.style?.passwordPlaceholderTextFont ||  fontHelper(theme.typography.subtitle1),
		passwordPlaceholderTextColor: joinGroupConfiguration?.style?.passwordPlaceholderTextColor || theme.palette.getAccent(),
		passwordInputBackground:joinGroupConfiguration?.style?.passwordInputBackground ||  theme.palette.getAccent50(),
		passwordInputBorder:joinGroupConfiguration?.style?.passwordInputBorder ||  "none",
		passwordInputBorderRadius:joinGroupConfiguration?.style?.passwordInputBorderRadius ||  "8px",
		passwordInputBoxShadow:joinGroupConfiguration?.style?.passwordInputBoxShadow ||  `${theme.palette.getAccent50()} 0px 0px 0px 1px`,
		joinButtonTextFont:joinGroupConfiguration?.style?.joinButtonTextFont ||  fontHelper(theme.typography.title2),
		joinButtonTextColor:joinGroupConfiguration?.style?.joinButtonTextColor ||  theme.palette.getAccent900("light"),
		joinButtonBackground:joinGroupConfiguration?.style?.joinButtonBackground ||  theme.palette.getPrimary(),
		joinButtonBorderRadius:joinGroupConfiguration?.style?.joinButtonBorderRadius ||  "8px",
	};
};
