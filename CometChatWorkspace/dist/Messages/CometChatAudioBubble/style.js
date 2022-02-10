"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messageTitleStyle = exports.messageTimestampStyle = exports.messageSubTitleStyle = exports.messageSenderStyle = exports.messageRightGutterStyle = exports.messageLeftGutterStyle = exports.messageKitReceiptStyle = exports.messageKitBlockStyle = exports.messageHoverStyle = exports.messageGutterStyle = exports.messageBlockStyle = exports.messageBackgroundStyle = exports.messageAvatarStyle = exports.messageAudioStyle = exports.messageAudioIconStyle = exports.messageActionsStyle = void 0;

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
    borderRadius: props.cornerRadius,
    // padding: "8px 16px",
    // background: props.backgroundColor,
    border: props.border,
    display: "flex",
    width: "100%"
  };
};

exports.messageKitBlockStyle = messageKitBlockStyle;

var messageBlockStyle = function messageBlockStyle(props) {
  return {
    width: "100%",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
    margin: "0",
    display: "inline-block",
    "> audio": {
      width: "250px",
      height: "54px"
    }
  };
};

exports.messageBlockStyle = messageBlockStyle;

var messageTitleStyle = function messageTitleStyle(props) {
  return {
    color: "".concat(props.titleColor),
    font: "".concat(props.titleFont)
  };
};

exports.messageTitleStyle = messageTitleStyle;

var messageSubTitleStyle = function messageSubTitleStyle(props) {
  return {
    color: "".concat(props.subTitleColor),
    font: "".concat(props.subTitleFont)
  };
};

exports.messageSubTitleStyle = messageSubTitleStyle;

var messageAudioStyle = function messageAudioStyle(props) {
  return {
    width: "24px"
  };
};

exports.messageAudioStyle = messageAudioStyle;

var messageAudioIconStyle = function messageAudioIconStyle(props) {
  return {
    mask: "url(".concat(props.iconURL, ") center center no-repeat"),
    backgroundColor: "".concat(props.iconTint),
    display: "inline-block",
    width: "24px",
    height: "24px"
  };
};

exports.messageAudioIconStyle = messageAudioIconStyle;

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