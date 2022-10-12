import { BaseStyles } from "../../Shared";
/**
 * @class UsersStyle
 * @description Styling component for Users
 * @param  {number} height
 * @param  {number} width
 * @param  {object} border
 * @param  {number} borderRadius
 * @param  {string} backgroundColor
 * @param  {object} titleFont
 * @param  {string} titleColor
 * @param  {string} backIconTint
 * @param  {object} searchBorder
 * @param  {number} searchBorderRadius
 * @param  {string} searchBackground
 * @param  {object} searchTextFont
 * @param  {string} searchTextColor
 * @param  {string} searchIconTint
 */
export class UsersStyles extends BaseStyles {
	constructor({
		width = "280px",
		height = "100%",
		backgroundColor = "",
		border = {
			borderWidth: 0,
			borderColor: "transparent",
			borderStyle: "solid",
		},
		borderRadius = 0,
		titleFont = "",
        titleColor = "",
        backIconTint = "",
        searchBorder = {
			borderWidth: 1,
			borderColor: "#141414",
			borderStyle: "solid",
		},
		searchBorderRadius = 8,
		searchBackground = "",
		searchTextFont = "",
        searchTextColor = "",
        searchIconTint = "",
	}) {
		super({
			height,
			width,
			border,
			borderRadius,
			backgroundColor,
		});
		this.titleFont = titleFont;
		this.titleColor = titleColor;
		this.backIconTint = backIconTint;
		this.searchBorder = searchBorder;
		this.searchBackground = searchBackground;
		this.searchBorderRadius = searchBorderRadius;
		this.searchTextFont = searchTextFont;
		this.searchTextColor = searchTextColor;
		this.searchIconTint = searchIconTint;
	}
}
