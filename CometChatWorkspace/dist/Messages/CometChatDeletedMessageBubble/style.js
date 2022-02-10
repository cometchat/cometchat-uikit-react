"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nameWrapperStyle = exports.nameStyle = exports.messageWrapperStyle = exports.messageTxtWrapperStyle = exports.messageTxtStyle = exports.messageTimeStampStyle = exports.messageThumbnailStyle = exports.messageInfoWrapperStyle = exports.messageDetailStyle = exports.messageContainerStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ = require("../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var messageContainerStyle = function messageContainerStyle(props, loggedInUser) {
  var _props$messageObject, _props$messageObject$;

  var alignment = ((_props$messageObject = props.messageObject) === null || _props$messageObject === void 0 ? void 0 : (_props$messageObject$ = _props$messageObject.sender) === null || _props$messageObject$ === void 0 ? void 0 : _props$messageObject$.uid) === (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.uid) ? {
    alignSelf: "flex-end"
  } : {
    alignSelf: "flex-start"
  };
  return _objectSpread({
    marginBottom: "16px",
    paddingLeft: "16px",
    paddingRight: "16px",
    clear: "both",
    flexShrink: "0"
  }, alignment);
};

exports.messageContainerStyle = messageContainerStyle;

var messageWrapperStyle = function messageWrapperStyle(props, loggedInUser) {
  var _props$messageObject2, _props$messageObject3;

  var alignment = ((_props$messageObject2 = props.messageObject) === null || _props$messageObject2 === void 0 ? void 0 : (_props$messageObject3 = _props$messageObject2.sender) === null || _props$messageObject3 === void 0 ? void 0 : _props$messageObject3.uid) === (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.uid) ? {
    display: "flex",
    flexDirection: "column"
  } : {};
  return _objectSpread({
    flex: "1 1",
    position: "relative",
    width: "100%"
  }, alignment);
};

exports.messageWrapperStyle = messageWrapperStyle;

var messageTxtWrapperStyle = function messageTxtWrapperStyle(props) {
  var _props$messageObject4, _props$messageObject5, _props$loggedInUser;

  var alignment = ((_props$messageObject4 = props.messageObject) === null || _props$messageObject4 === void 0 ? void 0 : (_props$messageObject5 = _props$messageObject4.sender) === null || _props$messageObject5 === void 0 ? void 0 : _props$messageObject5.uid) === ((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid) ? {
    alignSelf: "flex-end"
  } : {
    alignSelf: "flex-start"
  };
  return _objectSpread({
    display: "inline-block",
    borderRadius: "12px",
    padding: "8px 12px",
    alignSelf: "flex-end",
    Width: "100%",
    backgroundColor: "#f6f6f6",
    fontStyle: "italic"
  }, alignment);
};

exports.messageTxtWrapperStyle = messageTxtWrapperStyle;

var messageTxtStyle = function messageTxtStyle() {
  return {
    fontSize: "14px!important",
    margin: "0",
    lineHeight: "20px!important",
    color: "rgba(20, 20, 20, 0.4)"
  };
};

exports.messageTxtStyle = messageTxtStyle;

var messageInfoWrapperStyle = function messageInfoWrapperStyle(props) {
  var _props$messageObject6, _props$messageObject7, _props$loggedInUser2;

  var alignment = ((_props$messageObject6 = props.messageObject) === null || _props$messageObject6 === void 0 ? void 0 : (_props$messageObject7 = _props$messageObject6.sender) === null || _props$messageObject7 === void 0 ? void 0 : _props$messageObject7.uid) === ((_props$loggedInUser2 = props.loggedInUser) === null || _props$loggedInUser2 === void 0 ? void 0 : _props$loggedInUser2.uid) ? {
    alignSelf: "flex-end"
  } : {
    alignSelf: "flex-start"
  };
  return _objectSpread({}, alignment);
};

exports.messageInfoWrapperStyle = messageInfoWrapperStyle;

var messageTimeStampStyle = function messageTimeStampStyle() {
  return {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 500,
    lineHeight: "12px",
    textTransform: "uppercase",
    color: "rgba(20, 20, 20, 0.4)"
  };
};

exports.messageTimeStampStyle = messageTimeStampStyle;

var messageThumbnailStyle = function messageThumbnailStyle() {
  return {
    width: "36px",
    height: "36px",
    margin: "12px 0",
    float: "left"
  };
};

exports.messageThumbnailStyle = messageThumbnailStyle;

var messageDetailStyle = function messageDetailStyle(props) {
  var _props$messageObject8, _props$messageObject9, _props$loggedInUser3;

  var paddingSpace = {};

  if (((_props$messageObject8 = props.messageObject) === null || _props$messageObject8 === void 0 ? void 0 : (_props$messageObject9 = _props$messageObject8.sender) === null || _props$messageObject9 === void 0 ? void 0 : _props$messageObject9.uid) !== ((_props$loggedInUser3 = props.loggedInUser) === null || _props$loggedInUser3 === void 0 ? void 0 : _props$loggedInUser3.uid) && props.messageObject.receiverType === _.CometChatMessageReceiverType.group) {
    paddingSpace = {
      paddingLeft: "5px"
    };
  }

  return _objectSpread({
    flex: "1 1",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  }, paddingSpace);
};

exports.messageDetailStyle = messageDetailStyle;

var nameWrapperStyle = function nameWrapperStyle(props) {
  var _props$messageObject10, _props$messageObject11, _props$loggedInUser4;

  var paddingSpace = {};

  if (((_props$messageObject10 = props.messageObject) === null || _props$messageObject10 === void 0 ? void 0 : (_props$messageObject11 = _props$messageObject10.sender) === null || _props$messageObject11 === void 0 ? void 0 : _props$messageObject11.uid) === ((_props$loggedInUser4 = props.loggedInUser) === null || _props$loggedInUser4 === void 0 ? void 0 : _props$loggedInUser4.uid) && props.messageObject.receiverType === _.CometChatMessageReceiverType.group) {
    paddingSpace = {
      padding: "3px 5px"
    };
  }

  return _objectSpread({
    alignSelf: "flex-start"
  }, paddingSpace);
};

exports.nameWrapperStyle = nameWrapperStyle;

var nameStyle = function nameStyle() {
  return {
    fontSize: "10px",
    color: "rgba(20, 20, 20, 0.4)"
  };
};

exports.nameStyle = nameStyle;