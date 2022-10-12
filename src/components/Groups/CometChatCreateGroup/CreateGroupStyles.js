import { BaseStyles } from "../../Shared";

/**
 * @class CreateGroupStyles
 * @description CreateGroupStyles class is used for defining the styles for CreateGroup component
 * @param {string}width
 * @param {string} height
 * @param {string} background
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} boxShadow
 * @param {string} closeIconTint
 * @param {string} titleTextFont
 * @param {string} titleTextColor
 * @param {string} errorTextFont
 * @param {string} errorTextBackground
 * @param {string} errorTextBorderRadius
 * @param {string} errorTextBorder
 * @param {string} errorTextColor
 * @param {string} groupTypeTextFont
 * @param {string} groupTypeTextColor
 * @param {string} groupTypeTextBackground
 * @param {string} groupTypeTextActiveBackground
 * @param {string} namePlaceholderTextFont
 * @param {string} namePlaceholderTextColor
 * @param {string} nameInputBackground
 * @param {string} nameInputBorder
 * @param {string} nameInputBorderRadius
 * @param {string} nameInputBoxShadow
 * @param {string} passwordPlaceholderTextFont
 * @param {string} passwordPlaceholderTextColor
 * @param {string} passwordInputBackground
 * @param {string} passwordInputBorder
 * @param {string} passwordInputBorderRadius
 * @param {string} passwordInputBoxShadow
 * @param {string} createGroupButtonTextFont
 * @param {string} createGroupButtonTextColor
 * @param {string} createGroupButtonBackground
 * @param {string} createGroupButtonBorderRadius
 */
export class CreateGroupStyles extends BaseStyles {
	constructor({
		width = "",
		height = "",
		background = "",
		border = "",
		borderRadius = "",
		boxShadow = "",
		closeIconTint = "",
		titleTextFont = "",
		titleTextColor = "",
		errorTextFont = "",
		errorTextBackground = "",
		errorTextBorderRadius = "",
		errorTextBorder = "",
		errorTextColor = "",
		groupTypeTextFont = "",
		groupTypeTextColor = "",
		groupTypeTextBackground = "",
		groupTypeTextActiveBackground = "",
		namePlaceholderTextFont = "",
		namePlaceholderTextColor = "",
		nameInputBackground = "",
		nameInputBorder = "",
		nameInputBorderRadius = "",
		nameInputBoxShadow = "",
		passwordPlaceholderTextFont = "",
		passwordPlaceholderTextColor = "",
		passwordInputBackground = "",
		passwordInputBorder = "",
		passwordInputBorderRadius = "",
		passwordInputBoxShadow = "",
		createGroupButtonTextFont = "",
		createGroupButtonTextColor = "",
		createGroupButtonBackground = "",
		createGroupButtonBorderRadius = "",
	}) {
		super({
			width,
			height,
			background,
			border,
			borderRadius,
		});
		this.boxShadow = boxShadow;
		this.closeIconTint = closeIconTint;
		this.titleTextFont = titleTextFont;
		this.titleTextColor = titleTextColor;
		this.errorTextFont = errorTextFont;
		this.errorTextBackground = errorTextBackground;
		this.errorTextBorderRadius = errorTextBorderRadius;
		this.errorTextBorder = errorTextBorder;
		this.errorTextColor = errorTextColor;
		this.groupTypeTextFont = groupTypeTextFont;
		this.groupTypeTextColor = groupTypeTextColor;
		this.groupTypeTextBackground = groupTypeTextBackground;
		this.groupTypeTextActiveBackground = groupTypeTextActiveBackground;
		this.namePlaceholderTextFont = namePlaceholderTextFont;
		this.namePlaceholderTextColor = namePlaceholderTextColor;
		this.nameInputBackground = nameInputBackground;
		this.nameInputBorder = nameInputBorder;
		this.nameInputBorderRadius = nameInputBorderRadius;
		this.nameInputBoxShadow = nameInputBoxShadow;
		this.passwordPlaceholderTextFont = passwordPlaceholderTextFont;
		this.passwordPlaceholderTextColor = passwordPlaceholderTextColor;
		this.passwordInputBackground = passwordInputBackground;
		this.passwordInputBorder = passwordInputBorder;
		this.passwordInputBorderRadius = passwordInputBorderRadius;
		this.passwordInputBoxShadow = passwordInputBoxShadow;
		this.createGroupButtonTextFont = createGroupButtonTextFont;
		this.createGroupButtonTextColor = createGroupButtonTextColor;
		this.createGroupButtonBackground = createGroupButtonBackground;
		this.createGroupButtonBorderRadius = createGroupButtonBorderRadius;
	}
}
