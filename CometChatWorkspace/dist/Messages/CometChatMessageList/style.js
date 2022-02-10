"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messageDateStyle = exports.messageDateContainerStyle = exports.messageBubbleStyle = exports.listWrapperStyle = exports.decoratorMessageTxtStyle = exports.decoratorMessageStyle = exports.chatListStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ = require("../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var chatListStyle = function chatListStyle(context) {
  return {
    backgroundColor: "#fff",
    zIndex: "1",
    width: "100%",
    height: "100%",
    flex: "1 1 0",
    order: "2",
    position: "relative"
  };
};

exports.chatListStyle = chatListStyle;

var listWrapperStyle = function listWrapperStyle() {
  return {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowX: "hidden",
    overflowY: "scroll",
    position: "absolute",
    top: "0",
    transition: "background .3s ease-out .1s",
    width: "100%",
    zIndex: "100",
    paddingTop: "16px"
  };
};

exports.listWrapperStyle = listWrapperStyle;

var messageDateContainerStyle = function messageDateContainerStyle() {
  return {
    margin: "16px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
};

exports.messageDateContainerStyle = messageDateContainerStyle;

var messageDateStyle = function messageDateStyle(context) {
  return {
    padding: "8px 12px",
    backgroundColor: "rgb(246, 246, 246)",
    color: "rgb(20, 20, 20)",
    borderRadius: "10px"
  };
};

exports.messageDateStyle = messageDateStyle;

var decoratorMessageStyle = function decoratorMessageStyle() {
  return {
    overflow: "hidden",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%"
  };
};

exports.decoratorMessageStyle = decoratorMessageStyle;

var decoratorMessageTxtStyle = function decoratorMessageTxtStyle(props) {
  return {
    margin: "0",
    height: "36px",
    color: "rgba(20,20,20, 20%)",
    fontSize: "20px!important",
    fontWeight: "600",
    lineHeight: "30px"
  };
};

exports.decoratorMessageTxtStyle = decoratorMessageTxtStyle;

var messageBubbleStyle = function messageBubbleStyle(props, loggedInUser, messageObject) {
  var _messageObject$sender;

  var flexAlignment = {
    alignSelf: "flex-start"
  };
  var userNameAlignment = {
    textAlign: "left"
  };
  var justifyContent = {
    justifyContent: "flex-start"
  };

  if (props.messageAlignment === _.messageAlignment.standard && (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.uid) === (messageObject === null || messageObject === void 0 ? void 0 : (_messageObject$sender = messageObject.sender) === null || _messageObject$sender === void 0 ? void 0 : _messageObject$sender.uid)) {
    flexAlignment = {
      alignSelf: "flex-end"
    };
    userNameAlignment = {
      textAlign: "right"
    };
    justifyContent = {
      justifyContent: "flex-end"
    };
  }

  return _objectSpread(_objectSpread({
    maxWidth: "65%",
    height: "auto",
    userSelect: "text",
    marginBottom: "8px"
  }, flexAlignment), {}, {
    ".message_kit__sender": _objectSpread({}, userNameAlignment),
    ".message_kit__receipt_bar, .message_kit__username_bar": _objectSpread({}, justifyContent)
  });
};

exports.messageBubbleStyle = messageBubbleStyle;