import { BaseStyles } from "../../Shared/Base/BaseStyles";

/**
 * @class JoinProtectedGroupStyles
 * @description JoinProtectedGroupStyles class is used for defining the styles for JoinProtectedGroup component
 * boxShadow
 *@param {string} titleTextFont
 *@param {string} titleTextColor
 *@param {string} errorTextFont
 *@param {string} errorTextColor
 *@param {string} passwordTextFont
 *@param {string} passwordTextColor
 *@param {string} passwordPlaceholderTextFont
 *@param {string} passwordPlaceholderTextColor
 *@param {string} passwordInputBackground
 *@param {string} passwordInputBorder
 *@param {string} passwordInputBorderRadius
 *@param {string} passwordInputBoxShadow
 *@param {string} joinButtonTextFont
 *@param {string} joinButtonTextColor
 *@param {string} joinButtonBackground
 *@param {string} joinButtonBorderRadius
 */

class JoinProtectedGroupStyles extends BaseStyles {
	constructor({
		width = "100%",
		height = "100%",
		background = "",
		border = "",
		borderRadius = "0",
		boxShadow = "",
		titleTextFont = "",
		titleTextColor = "",
		errorTextFont = "",
		errorTextColor = "",
		passwordTextFont = "",
		passwordTextColor = "",
		passwordPlaceholderTextFont = "",
		passwordPlaceholderTextColor = "",
		passwordInputBackground = "",
		passwordInputBorder = "",
		passwordInputBorderRadius = "",
		passwordInputBoxShadow = "",
		joinButtonTextFont = "",
		joinButtonTextColor = "",
		joinButtonBackground = "",
		joinButtonBorderRadius = "",
	}) {
		super({
			width,
			height,
			background,
			border,
			borderRadius,
		});
		this.boxShadow = boxShadow;
		this.titleTextFont = titleTextColor;
		this.titleTextColor = titleTextFont;
		this.errorTextFont = errorTextFont;
		this.errorTextColor = errorTextColor;
		this.passwordTextFont = passwordTextFont;
		this.passwordTextColor = passwordTextColor;
		this.passwordPlaceholderTextFont = passwordPlaceholderTextFont;
		this.passwordPlaceholderTextColor = passwordPlaceholderTextColor;
		this.passwordInputBackground = passwordInputBackground;
		this.passwordInputBorder = passwordInputBorder;
		this.passwordInputBorderRadius = passwordInputBorderRadius;
		this.passwordInputBoxShadow = passwordInputBoxShadow;
		this.joinButtonTextFont = joinButtonTextFont;
		this.joinButtonTextColor = joinButtonTextColor;
		this.joinButtonBackground = joinButtonBackground;
		this.joinButtonBorderRadius = joinButtonBorderRadius;
	}
}

export { JoinProtectedGroupStyles };
