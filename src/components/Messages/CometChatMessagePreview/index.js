import React from "react";
import PropTypes from "prop-types";

import { getExtensionsData, ExtensionConstants, CometChatTheme } from "../..";

import {
  editPreviewContainerStyle,
  previewHeadingStyle,
  previewTitleStyle,
  previewCloseStyle,
  previewSubTitleStyle,
} from "./style";

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
const CometChatMessagePreview = (props) => {
  let messageText = props.messagePreviewSubtitle;
  const theme = new CometChatTheme(props.theme || {});

  //xss extensions data
  const xssData = getExtensionsData(
    props.messageObject,
    ExtensionConstants.xssFilter
  );
  if (
    xssData &&
    xssData.hasOwnProperty(ExtensionConstants.sanitizedText) &&
    xssData.hasOwnProperty(ExtensionConstants.hasXSS) &&
    xssData.hasXSS === ExtensionConstants.yes
  ) {
    messageText = xssData.sanitized_text;
  }

  //datamasking extensions data
  const maskedData = getExtensionsData(
    props.messageObject,
    ExtensionConstants.dataMasking
  );
  if (
    maskedData &&
    maskedData.hasOwnProperty(ExtensionConstants.data) &&
    maskedData.data.hasOwnProperty(ExtensionConstants.sensitiveData) &&
    maskedData.data.hasOwnProperty(ExtensionConstants.messageMasked) &&
    maskedData.data.sensitive_data === ExtensionConstants.yes
  ) {
    messageText = maskedData.data.message_masked;
  }

  //profanity extensions data
  const profaneData = getExtensionsData(
    props.messageObject,
    ExtensionConstants.profanityFilter
  );
  if (
    profaneData &&
    profaneData.hasOwnProperty(ExtensionConstants.profanity) &&
    profaneData.hasOwnProperty(ExtensionConstants.messageClean) &&
    profaneData.profanity === ExtensionConstants.yes
  ) {
    messageText = profaneData.message_clean;
  }

  return (
    <div style={editPreviewContainerStyle(props, theme)}>
      <div style={previewHeadingStyle()}>
        <div style={previewTitleStyle(props, theme)}>
          {props.messagePreviewTitle}
        </div>
        <span
          style={previewCloseStyle(props)}
          onClick={props.onCloseClick}
        ></span>
      </div>
      <div style={previewSubTitleStyle(props, theme)}>{messageText}</div>
    </div>
  );
};

CometChatMessagePreview.defaultProps = {
  messagePreviewTitle: "",
  messagePreviewSubtitle: "",
  closeIconURL: closeIcon,
  onCloseClick: null,
  style: {
    widht: "100%",
    height: "auto",
    border: "3px solid RGBA(20, 20, 20, 0.11)",
    background: "RGBA(255,255,255)",
    borderRadius: "none",
    messagePreviewTitleFont: "500 12px Inter, sans-serif",
    messagePreviewTitleColor: "RGB(20, 20, 20)",
    messagePreviewSubtitleColor: "RGBA(20, 20, 20, 0.6)",
    messagePreviewSubtitleFont: "400 13px Inter, sans-serif",
    closeIconTint: "RGBA(20, 20, 20, 0.46)",
  },
};

CometChatMessagePreview.propTypes = {
  messagePreviewTitle: PropTypes.string,
  messagePreviewSubtitle: PropTypes.string,
  closeIconURL: PropTypes.string,
  onCloseClick: PropTypes.func,
  style: PropTypes.object,
};
export { CometChatMessagePreview };
