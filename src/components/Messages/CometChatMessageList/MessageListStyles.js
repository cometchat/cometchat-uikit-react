import { BaseStyles } from "../../Shared"
/**
 * @class MessageListStyles
 * @description MessageListStyles class is used for defining the messageList component's style
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} loadingIconTint
 * @param {String} TextFont
 * @param {String} TextColor
 * @param {String} emptyStateTextFont
 * @param {String} emptyStateTextColor
 * @param {String} errorStateTextFont
 * @param {String} errorStateTextColor
 */

class MessageListStyles extends BaseStyles {
	constructor({
		width,
		height,
		background,
		border,
		borderRadius,
		loadingIconTint,
		TextFont,
		TextColor,
		emptyStateTextFont,
		emptyStateTextColor,
		errorStateTextFont,
		errorStateTextColor,
	}) {
		super({ width, height, background, border, borderRadius });
		this.loadingIconTint = loadingIconTint;
		this.TextFont = TextFont;
		this.TextColor = TextColor;
		this.emptyStateTextFont = emptyStateTextFont;
		this.emptyStateTextColor = emptyStateTextColor;
		this.errorStateTextFont = errorStateTextFont;
		this.errorStateTextColor = errorStateTextColor;
	}
}
export { MessageListStyles };
