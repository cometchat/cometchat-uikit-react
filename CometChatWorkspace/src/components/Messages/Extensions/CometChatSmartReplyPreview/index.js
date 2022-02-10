import React from "react";
import PropTypes from "prop-types";

import { previewWrapperStyle, previewHeadingStyle, previewCloseStyle, previewOptionsWrapperStyle, previewOptionStyle } from "./style";

import closeIcon from "./resources/close.svg";

const CometChatSmartReplyPreview = props => {
	const options = props.options.map((option, key) => {
		return (
			<div key={key} style={previewOptionStyle()} className="option" onClick={() => props.clicked(option)}>
				{option}
			</div>
		);
	});

	return (
		<div style={previewWrapperStyle()} className="reply__preview__wrapper">
			<div style={previewHeadingStyle()} className="preview__heading">
				<div style={previewCloseStyle(closeIcon)} onClick={props.close} className="preview__close"></div>
			</div>
			<div style={previewOptionsWrapperStyle()} className="preview__options">
				{options}
			</div>
		</div>
	);
};

// Specifies the default values for props:
CometChatSmartReplyPreview.defaultProps = {};

CometChatSmartReplyPreview.propTypes = {};

export { CometChatSmartReplyPreview };
