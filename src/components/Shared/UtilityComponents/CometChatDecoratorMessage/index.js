import React from "react";
import PropTypes from "prop-types";

const CometChatDecoratorMessage = props => {
	
	/**
	 * Component template scoping
	 */
	if (props.text) {
		const getStyle = () => {
			return {
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "100%",
				backgroundColor: props.background,
				color: props.textColor,
				font: props.textFont,
			};
		};

		return <div style={getStyle()}>{props.text}</div>;
	}

	return null;
};

/**
 * Component default props values
 */
CometChatDecoratorMessage.defaultProps = {
	background: "rgba(51, 153, 255, 1)",
	textColor: "white",
	textFont: "600 12px Inter",
	text: ""
};

/**
 * Component default props
 */
CometChatDecoratorMessage.propTypes = {
	background: PropTypes.string,
	textColor: PropTypes.string,
	textFont: PropTypes.string,
	text: PropTypes.string
};

export { CometChatDecoratorMessage };