"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messageTimestampStyle = exports.messageSenderStyle = exports.messageRightGutterStyle = exports.messageLeftGutterStyle = exports.messageKitReceiptStyle = exports.messageKitBlockStyle = exports.messageHoverStyle = exports.messageGutterStyle = exports.messageBlockStyle = exports.messageBackgroundStyle = exports.messageAvatarStyle = exports.messageActionsStyle = void 0;

var messageBackgroundStyle = function messageBackgroundStyle(props) {
  return {
    width: "".concat(props.width),
    height: "".concat(props.height),
    userSelect: "text"
  };
};

exports.messageBackgroundStyle = messageBackgroundStyle;

var messageHoverStyle = function messageHoverStyle(props) {
  return {
    width: "100%",
    height: "auto"
  };
};

exports.messageHoverStyle = messageHoverStyle;

var messageActionsStyle = function messageActionsStyle() {
  return {
    position: "relative"
  };
};

exports.messageActionsStyle = messageActionsStyle;

var messageGutterStyle = function messageGutterStyle(props) {
  return {
    padding: "8px 20px",
    display: "flex",
    width: "100%"
  };
};

exports.messageGutterStyle = messageGutterStyle;

var messageLeftGutterStyle = function messageLeftGutterStyle(props) {
  return {
    marginRight: "8px",
    display: "flex",
    flexDirection: "column"
  };
};

exports.messageLeftGutterStyle = messageLeftGutterStyle;

var messageRightGutterStyle = function messageRightGutterStyle() {
  return {
    flex: "1 1 0",
    minWidth: "0",
    padding: "8px",
    paddingLeft: "16px",
    margin: "-8px -8px -16px -16px"
  };
};

exports.messageRightGutterStyle = messageRightGutterStyle;

var messageKitBlockStyle = function messageKitBlockStyle(props) {
  return {
    padding: "0",
    borderRadius: props.cornerRadius,
    background: props.backgroundColor,
    border: props.border,
    height: props.height
  };
};

exports.messageKitBlockStyle = messageKitBlockStyle;

var messageBlockStyle = function messageBlockStyle(props) {
  return {
    margin: "0",
    maxWidth: props.width,
    height: props.height,
    borderRadius: "inherit"
  };
};

exports.messageBlockStyle = messageBlockStyle;

var messageAvatarStyle = function messageAvatarStyle() {
  return {
    flexShrink: "0",
    position: "relative"
  };
};

exports.messageAvatarStyle = messageAvatarStyle;

var messageSenderStyle = function messageSenderStyle(props) {
  return {
    color: props.usernameColor,
    font: props.usernameFont
  };
};

exports.messageSenderStyle = messageSenderStyle;

var messageKitReceiptStyle = function messageKitReceiptStyle(props) {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px"
  };
};

exports.messageKitReceiptStyle = messageKitReceiptStyle;

var messageTimestampStyle = function messageTimestampStyle(props) {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px"
  };
};

exports.messageTimestampStyle = messageTimestampStyle;