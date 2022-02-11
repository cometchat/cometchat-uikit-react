import React from "react";
import PropTypes from "prop-types";

const CometChatBadgeCount = props => {
	
	if (props.count) {
		const getStyle = () => {
			return {
				border: props.border,
				borderRadius: props.cornerRadius,
				backgroundColor: props.background,
				color: props.textColor,
				font: props.textFont,
				minWidth: props.width,
				height: props.height,
				textAlign: "center",
				display: "inline-block",
				padding: "2px 6px",
			};
		};

		return <div style={getStyle()}>{props.count}</div>;
	}

	return null;
};

// Specifies the default values for props
CometChatBadgeCount.defaultProps = {
	count: 0,
	border: "1px solid transparent",
	cornerRadius: "11px",
	background: "rgba(51, 153, 255, 1)",
	textColor: "white",
	textFont: "600 12px Inter",
	width: "24px",
	height: "20px",
};

CometChatBadgeCount.propTypes = {
	count: PropTypes.number,
	width: PropTypes.string,
	height: PropTypes.string,
	border: PropTypes.string,
	cornerRadius: PropTypes.string,
	background: PropTypes.string,
	textColor: PropTypes.string,
	textFont: PropTypes.string,
};

export { CometChatBadgeCount };