import React from "react";
import PropTypes from "prop-types";

import { getExtensionsData, metadataKey } from "../";
import { localize } from "../../";

import { editPreviewContainerStyle, previewHeadingStyle, previewTextStyle, previewCloseStyle } from "./style";

import closeIcon from "./resources/close.svg";

/**
 *
 * CometChatMessagePreview
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatMessagePreview = props => {
	let messageText = props.messageObject.text;

	//xss extensions data
	const xssData = getExtensionsData(props.messageObject, metadataKey.extensions.xssfilter);
	if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
		messageText = xssData.sanitized_text;
	}

	//datamasking extensions data
	const maskedData = getExtensionsData(props.messageObject, metadataKey.extensions.datamasking);
	if (maskedData && maskedData.hasOwnProperty("data") && maskedData.data.hasOwnProperty("sensitive_data") && maskedData.data.hasOwnProperty("message_masked") && maskedData.data.sensitive_data === "yes") {
		messageText = maskedData.data.message_masked;
	}

	//profanity extensions data
	const profaneData = getExtensionsData(props.messageObject, metadataKey.extensions.profanityfilter);
	if (profaneData && profaneData.hasOwnProperty("profanity") && profaneData.hasOwnProperty("message_clean") && profaneData.profanity === "yes") {
		messageText = profaneData.message_clean;
	}

	return (
		<div style={editPreviewContainerStyle(props)}>
			<div style={previewHeadingStyle()}>
				<div style={previewTextStyle()}>{localize("EDIT_MESSAGE")}</div>
				<span style={previewCloseStyle(props)} onClick={props.onClose}></span>
			</div>
			<div>{messageText}</div>
		</div>
	);
};

CometChatMessagePreview.propTypes = {
	border: PropTypes.string,
	background: PropTypes.string,
	messageObject: PropTypes.object,
	closeIconURL: PropTypes.string,
	closeIconTint: PropTypes.string,
};

CometChatMessagePreview.defaultProps = {
	border: "1px solid rgb(234, 234, 234)",
	background: "#fff",
	messageObject: null,
	closeIconURL: closeIcon,
	closeIconTint: "#39f",
};

export { CometChatMessagePreview };
