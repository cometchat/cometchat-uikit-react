import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";
import srcIcon from "./resources/default.jpg";

const CometChatAvatar = props => {
	const [imageURL, setImageURL] = React.useState(srcIcon);

	const getImageStyle = () => {
		return {
			display: "flex",
			width: "100%",
			height: "100%",
			flex: "1 1 100%",
			backgroundColor: props.background,
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			backgroundSize: props.backgroundSize,
			backgroundImage: `url(${imageURL})`,
			border: props.border,
			borderRadius: props.cornerRadius,
		};
	};

	const getContainerStyle = () => {
		return {
			height: props.height,
			width: props.width,
			borderRadius: props.cornerRadius,
			margin: props.outerViewSpacing,
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "stretch",
			backgroundColor: "#ffffff",
			boxSizing: "content-box",
			cursor: "inherit",
			outline: "none",
			overflow: "hidden",
			position: "static",
			padding: "0",
		};
	};

	const getOuterViewStyle = () => {
		return {
			display: "inline-block",
			borderRadius: props.cornerRadius,
			border: props.outerView,
			margin: "0",
			padding: "0",
		};
	};

	Hooks(setImageURL, props);

	return (
		<div style={getOuterViewStyle()}>
			<span style={getContainerStyle()}>
				<span style={getImageStyle()}></span>
			</span>
		</div>
	);
};

// Specifies the default values for props
CometChatAvatar.defaultProps = {
	cornerRadius: "50%",
	border: "1px solid rgba(20, 20, 20, 8%)",
	background: "#3399FF",
	backgroundSize: "cover",
	textColor: "#ffffff",
	textFont: "bold 80px Inter",
	outerView: "2px solid #39f",
	outerViewSpacing: "4px",
	width: "40px",
	height: "40px",
	image: "",
	user: {},
	group: {},
};

CometChatAvatar.propTypes = {
	cornerRadius: PropTypes.string,
	border: PropTypes.string,
	background: PropTypes.string,
	backgroundSize: PropTypes.string,
	textColor: PropTypes.string,
	textFont: PropTypes.string,
	outerView: PropTypes.string,
	outerViewSpacing: PropTypes.string,
	width: PropTypes.string,
	height: PropTypes.string,
	image: PropTypes.string,
	user: PropTypes.object,
	group: PropTypes.object,
};

export { CometChatAvatar };