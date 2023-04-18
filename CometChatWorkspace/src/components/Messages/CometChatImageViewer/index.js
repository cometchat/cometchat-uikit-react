import React, { useContext } from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";

import { CometChatBackdrop } from "../../Shared";
import { CometChatContext } from "../../../util/CometChatContext";

import { imageWrapperStyle, imgStyle } from "./style";

import loadingIcon from "./resources/ring.svg";
import closeIcon from "./resources/close.svg";

const CometChatImageViewer = (props) => {
	const context = useContext(CometChatContext);
	const [image, setImage] = React.useState(null);

	let img = new Image();
	img.src = props.message?.data?.attachments[0].url;

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
			<div
				css={imageWrapperStyle(context, closeIcon, image)}
				onClick={props.close}
				className='image__wrapper'
			>
				<img src={imageIcon} css={imgStyle(image)} alt={imageIcon} />
			</div>
		</React.Fragment>
	);
};

// Specifies the default values for props:
CometChatImageViewer.defaultProps = {
	count: 0,
	close: () => {},
};

CometChatImageViewer.propTypes = {
	show: PropTypes.bool,
	close: PropTypes.func,
	message: PropTypes.object.isRequired,
};

export { CometChatImageViewer };
