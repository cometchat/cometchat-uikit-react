import { BaseStyles } from "../../../Shared";

/**
 * @class MessageBubbleStyles
 * @description MessageBubbleStyle is used to defining message bubble style
 * @param {String} width
 * @param {String} height
 * @param {String} nameTextFont
 * @param {String} nameTextColor
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} background
 * @param {String} timestampFont
 * @param {String} timestampColor
 */

class MessageBubbleStyles extends BaseStyles {
	constructor({
		width,
		height,
		background,
		border,
		borderRadius,
		nameTextFont,
		nameTextColor,
		timestampFont,
		timestampColor,
	}) {
		super({
			width,
			height,
			background,
			border,
			borderRadius,
		});
		this.nameTextFont = nameTextFont;
		this.nameTextColor = nameTextColor;
		this.timestampFont = timestampFont;
		this.timestampColor = timestampColor;
	}
}

export { MessageBubbleStyles };
