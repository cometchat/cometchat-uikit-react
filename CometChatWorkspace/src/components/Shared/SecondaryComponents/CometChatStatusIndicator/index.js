import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

const CometChatStatusIndicator = props => {

	const [color, setColor] = React.useState(props.offlineBackgroundColor);

	const getStyle = () => ({
		border: props.border,
		borderRadius: props.cornerRadius,
		backgroundColor: color,
		width: props.width,
		height: props.height,
		display: "inline-block",
		...props.style,
	});

	Hooks(setColor, props);

	return <span style={getStyle()}></span>;
}

// Specifies the default values for props:
CometChatStatusIndicator.defaultProps = {
	width: "14px",
	height: "14px",
	border: "2px solid white",
	cornerRadius: "50%",
	onlineBackgroundColor: "#3BDF2F",
	offlineBackgroundColor: "#C4C4C4",
	status: "offline",
	style: null,
};

CometChatStatusIndicator.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	border: PropTypes.string,
	cornerRadius: PropTypes.string,
	onlineBackgroundColor: PropTypes.string,
	offlineBackgroundColor: PropTypes.string,
	status: PropTypes.oneOf(["online", "offline"]),
	style: PropTypes.object,
};

export { CometChatStatusIndicator };