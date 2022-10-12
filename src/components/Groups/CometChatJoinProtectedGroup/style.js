import { fontHelper } from "../..";

export const joinGroupContainerStyle = () => {
	return {
		margin: "auto",
		width: "100%",
		height: "100%",
		borderRadius: "8px",
		zIndex: "4",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
	};
};

export const joinGroupTitleStyle = (style, theme) => {
    return {
      
        font: style?.titleTextFont,
        color: style?.titleTextColor
    };
};

export const joinGroupPasswordInputStyle = (style, theme) => {
    return {
        width: "320px",
        height: "46px",
        color: style?.passwordTextFont,
        font: style?.passwordTextColor,
        background: style?.passwordInputBackground,
        border: style?.passwordInputBorder,
        borderRadius: style?.passwordInputBorderRadius,
		boxShadow: style?.passwordInputBoxShadow,
		margin: "38px 0px 16px 0px",
		outline: "none",
		padding:"6px 12px"
    };
};

export const joinGroupButtonStyle = (style, theme) => {
    return {
        width: "320px",
        height: "46px",
        font: style?.joinButtonTextFont,
        color:style?.joinButtonTextColor,
        background:style?.joinButtonBackground,
        borderRadius: style?.joinButtonBorderRadius
    };
};

export const errorContainerStyle = (style, theme) => {
	return {
		width: "328px",
		height: "60px",
		margin: "16px 0px 32px 0px" ,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		background: "rgba(255, 59, 48, 0.1)",
		border: "none",
		borderRadius: "8px",
	};
};

export const errorIconStyle = () => {
	return {
		iconBackground: "RGB(255, 59, 48)",
		iconTint: "white",
		iconBackgroundWidth: "38px",
		iconBackgroundHeight: "38px",
		iconWidth: "24px",
		iconHeight: "24px",
		margin: "0px 12px",
	};
};
export const errorTextStyle = (theme) => {
	return {
		color: theme.palette.getError(),
		font: fontHelper(theme.typography.text1),
	};
};
