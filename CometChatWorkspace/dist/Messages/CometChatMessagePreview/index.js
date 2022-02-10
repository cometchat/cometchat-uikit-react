"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessagePreview = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../");

var _2 = require("../../");

var _style = require("./style");

var _close = _interopRequireDefault(require("./resources/close.svg"));

/**
 *
 * CometChatMessagePreview
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
var CometChatMessagePreview = function CometChatMessagePreview(props) {
  var messageText = props.messageObject.text; //xss extensions data

  var xssData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.xssfilter);

  if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
    messageText = xssData.sanitized_text;
  } //datamasking extensions data


  var maskedData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.datamasking);

  if (maskedData && maskedData.hasOwnProperty("data") && maskedData.data.hasOwnProperty("sensitive_data") && maskedData.data.hasOwnProperty("message_masked") && maskedData.data.sensitive_data === "yes") {
    messageText = maskedData.data.message_masked;
  } //profanity extensions data


  var profaneData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.profanityfilter);

  if (profaneData && profaneData.hasOwnProperty("profanity") && profaneData.hasOwnProperty("message_clean") && profaneData.profanity === "yes") {
    messageText = profaneData.message_clean;
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.editPreviewContainerStyle)()
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.previewHeadingStyle)()
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.previewTextStyle)()
  }, (0, _2.localize)("EDIT_MESSAGE")), /*#__PURE__*/_react.default.createElement("span", {
    style: (0, _style.previewCloseStyle)(props),
    onClick: props.onClose
  })), /*#__PURE__*/_react.default.createElement("div", null, messageText));
};

exports.CometChatMessagePreview = CometChatMessagePreview;
CometChatMessagePreview.propTypes = {
  border: _propTypes.default.string,
  backgroundColor: _propTypes.default.string,
  messageObject: _propTypes.default.object,
  closeIconURL: _propTypes.default.string,
  closeIconTint: _propTypes.default.string
};
CometChatMessagePreview.defaultProps = {
  messageObject: null,
  closeIconURL: _close.default,
  closeIconTint: "#39f"
};