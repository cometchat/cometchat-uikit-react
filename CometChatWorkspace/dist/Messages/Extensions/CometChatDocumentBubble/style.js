"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messageTxtStyle = exports.messageTitleStyle = exports.messageTimestampStyle = exports.messageSenderStyle = exports.messageRightGutterStyle = exports.messageReplyReceiptStyle = exports.messageLeftGutterStyle = exports.messageKitReceiptStyle = exports.messageKitBlockStyle = exports.messageIconStyle = exports.messageHoverStyle = exports.messageGutterStyle = exports.messageBtnStyle = exports.messageBlockStyle = exports.messageAvatarStyle = exports.messageActionsStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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
  var position = props.messageAlignment === "standard" ? {
    justifyContent: "flex-end"
  } : {
    justifyContent: "flex-start"
  };
  return {
    padding: "8px 20px",
    display: "flex",
    width: "100%" // ".message_kit__reaction_bar": {
    // 	...position,
    // },

  };
};

exports.messageGutterStyle = messageGutterStyle;

var messageLeftGutterStyle = function messageLeftGutterStyle(props) {
  return {
    flexShrink: "0",
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
    background: props.backgroundColor,
    border: props.border,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "16px"
  };
};

exports.messageKitBlockStyle = messageKitBlockStyle;

var messageBlockStyle = function messageBlockStyle(props) {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
};

exports.messageBlockStyle = messageBlockStyle;

var messageIconStyle = function messageIconStyle(props) {
  return {
    mask: "url(".concat(props.iconURL, ") no-repeat left center"),
    backgroundColor: "".concat(props.iconTint),
    width: "24px",
    height: "24px",
    display: "inline-block"
  };
};

exports.messageIconStyle = messageIconStyle;

var messageTxtStyle = function messageTxtStyle(props) {
  return {
    margin: "0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    width: "calc(100% - 24px)",
    font: "".concat(props.titleFont),
    color: "".concat(props.titleColor),
    paddingLeft: "8px"
  };
};

exports.messageTxtStyle = messageTxtStyle;

var messageBtnStyle = function messageBtnStyle(props) {
  return {
    width: "100%",
    listStyleType: "none",
    padding: "0",
    margin: "0",
    li: {
      backgroundColor: "".concat(props.buttonBackgroundColor),
      borderRadius: props.cornerRadius,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      position: "relative",
      margin: "16px 0 0 0",
      padding: "8px",
      cursor: "pointer",
      "> p": {
        background: "0 0",
        textAlign: "center",
        color: "".concat(props.buttonTextColor),
        width: "100%",
        font: "".concat(props.buttonTextFont),
        display: "inline-block",
        margin: "0"
      }
    }
  };
};

exports.messageBtnStyle = messageBtnStyle;

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

var messageTitleStyle = function messageTitleStyle(props) {
  return {
    color: "".concat(props.titleColor),
    font: "".concat(props.titleFont)
  };
};

exports.messageTitleStyle = messageTitleStyle;

var messageReplyReceiptStyle = function messageReplyReceiptStyle(props) {
  var position = props.messageListAlignment === "standard" && props.messageAlignment === "right" ? {
    justifyContent: "flex-end"
  } : {
    justifyContent: "flex-start"
  };
  return _objectSpread({
    width: "100%",
    height: "24px",
    display: "flex",
    alignItems: "center"
  }, position);
};

exports.messageReplyReceiptStyle = messageReplyReceiptStyle;