import { BaseStyles } from "../../Shared";

/**
 * @class GroupListStyle
 * @description GroupListStyle class is used for defining the GroupList template.
 * @param {any} width
 * @param {any} height
 * @param {any} background
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} loadingIconTint
 * @param {string} emptyTextFont
 * @param {string} emptyTextColor
 * @param {string} errorTextFont
 * @param {string} errorTextColor
 */
export class GroupListStyle extends BaseStyles {
	constructor({
		width = "100%",
		height = "100%",
		background = "",
		border = "0 solid black",
		borderRadius = "0",
		loadingIconTint = "black",
		emptyTextFont = "",
		emptyTextColor = "#141414",
		errorTextFont = "",
		errorTextColor = "#141414",
	}) {
		super({
			width,
			height,
			background,
			border,
			borderRadius,
		});
		this.loadingIconTint = loadingIconTint;
		this.emptyTextFont = emptyTextFont;
		this.emptyTextColor = emptyTextColor;
		this.errorTextFont = errorTextFont;
		this.errorTextColor = errorTextColor;
	}
}
