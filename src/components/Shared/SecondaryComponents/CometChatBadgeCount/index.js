import React from "react";
import PropTypes from "prop-types";
import { BadgeCountStyles } from "../../../Shared/";

const CometChatBadgeCount = props => {

	/**
	 * Component template scoping
	 */
	if (props?.count) {
		const getStyle = () => {
			return {
				border: props?.style?.border,
				borderRadius: props?.style?.borderRadius,
				backgroundColor: props?.style?.background,
				color: props?.style?.textColor,
				font: props?.style?.textFont,
				minWidth: props?.style?.width,
				height: props?.style?.height,
				lineHeight: props?.style?.height,
				textAlign: "center",
				display: "inline-block",
				padding: "0px 10px",
			};
		};

		return <div style={getStyle()}>{props?.count >= 100 ? "99+" : props?.count}</div>;
	}

	return null;
};

/**
 * Component default props values
 */
CometChatBadgeCount.defaultProps = {
	count: 0,
	style: {
		textFont: "600 12px Inter",
		textColor: "#ffffff",
		width: "fit-content",
		height: "20px",
		background: "rgba(51, 153, 255, 1)",
		border: "none",
		borderRadius: "11px"
	}
};

/**
 * Component default props
 */
CometChatBadgeCount.propTypes = {
	count: PropTypes.number,
	style: PropTypes.object
};

export { CometChatBadgeCount };