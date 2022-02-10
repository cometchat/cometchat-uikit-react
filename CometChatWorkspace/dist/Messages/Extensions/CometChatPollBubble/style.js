"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.voteCountStyle = exports.pollQuestionStyle = exports.pollAnswerStyle = exports.messageTimestampStyle = exports.messageSenderStyle = exports.messageRightGutterStyle = exports.messageReplyReceiptStyle = exports.messageLeftGutterStyle = exports.messageKitReceiptStyle = exports.messageKitBlockStyle = exports.messageHoverStyle = exports.messageGutterStyle = exports.messageBlockStyle = exports.messageAvatarStyle = exports.messageActionsStyle = void 0;

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
  var position = props.messageListAlignment === "standard" && props.messageAlignment === "right" ? {
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
    padding: "16px",
    background: props.backgroundColor,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    border: props.border
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
    height: "100%"
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

var pollQuestionStyle = function pollQuestionStyle(props) {
  return {
    margin: "0",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
    width: "100%",
    font: props.pollQuestionFont,
    color: props.pollQuestionColor
  };
};

exports.pollQuestionStyle = pollQuestionStyle;

var pollAnswerStyle = function pollAnswerStyle() {
  return {
    listStyleType: "none",
    padding: "0",
    margin: "0"
  };
};

exports.pollAnswerStyle = pollAnswerStyle;

var voteCountStyle = function voteCountStyle(props) {
  return {
    width: "100%",
    "p": {
      margin: "0",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      textAlign: "left",
      width: "100%",
      font: props.voteCountFont,
      color: props.voteCountColor
    }
  };
};

exports.voteCountStyle = voteCountStyle;

var messageReplyReceiptStyle = function messageReplyReceiptStyle(props) {
  var position = props.messageAlignment === "standard" && props.messageAlignment === "right" ? {
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