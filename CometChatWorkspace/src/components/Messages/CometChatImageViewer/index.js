import React from "react";
import PropTypes from "prop-types";

import { CometChatBackdrop } from "../../";

import { imageWrapperStyle, imgStyle } from "./style";

import loadingIcon from "./resources/ring.svg";
import closeIcon from "./resources/close.svg";

const CometChatImageViewer = props => {
    
	const [image, setImage] = React.useState(null);

	let img = new Image();
	img.src = props.message.data.url;

	img.onload = () => {
		setImage(img.src);
	};

	let imageIcon = null;
	if (image) {
		imageIcon = image;
	} else {
		imageIcon = loadingIcon;
	}

	return (
		<React.Fragment>
			<CometChatBackdrop show={true} clicked={props.close} />
			<div style={imageWrapperStyle(closeIcon, image)} onClick={props.close} className="image__wrapper">
				<img src={imageIcon} style={imgStyle(image)} alt={imageIcon} />
			</div>
		</React.Fragment>
	);
};

// Specifies the default values for props:
CometChatImageViewer.defaultProps = {
	close: () => {},
};

CometChatImageViewer.propTypes = {
	show: PropTypes.bool,
	close: PropTypes.func,
};

export { CometChatImageViewer };
