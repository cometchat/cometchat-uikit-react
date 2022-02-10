"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chatUserStyle = exports.chatThumbnailStyle = exports.chatStatusStyle = exports.chatOptionWrapStyle = exports.chatNameStyle = exports.chatHeaderStyle = exports.chatDetailStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var chatHeaderStyle = function chatHeaderStyle(context) {
  return {
    padding: "16px",
    width: "100%",
    backgroundColor: "#fff",
    zIndex: "1",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
  };
};

exports.chatHeaderStyle = chatHeaderStyle;

var chatDetailStyle = function chatDetailStyle() {
  return {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "calc(100% - 116px)"
  };
};

exports.chatDetailStyle = chatDetailStyle;

var chatThumbnailStyle = function chatThumbnailStyle() {
  return {
    display: "inline-block",
    flexShrink: "0",
    margin: "0 16px"
  };
};

exports.chatThumbnailStyle = chatThumbnailStyle;

var chatUserStyle = function chatUserStyle(context) {
  var mq = (0, _toConsumableArray2.default)(_.BREAKPOINTS);
  return (0, _defineProperty2.default)({
    width: "calc(100% - 50px)",
    padding: "0",
    flexGrow: "1",
    display: "flex",
    flexDirection: "column"
  }, "@media ".concat(mq[1], ", ").concat(mq[2]), {
    width: "calc(100% - 80px)!important"
  });
};

exports.chatUserStyle = chatUserStyle;

var chatNameStyle = function chatNameStyle() {
  return {
    margin: "0",
    fontSize: "15px",
    fontWeight: "600",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  };
};

exports.chatNameStyle = chatNameStyle;

var chatStatusStyle = function chatStatusStyle(state, context) {
  var status = {};

  if (context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER) {
    status = {
      color: "".concat(context.theme.primaryIconColor),
      textTransform: "capitalize"
    };

    if (state.presence === "offline") {
      status = {
        color: "".concat(context.theme.subtitleColor),
        textTransform: "capitalize"
      };
    }

    if (state.typing) {
      status = {
        color: "".concat(context.theme.subtitleColor),
        textTransform: "none",
        fontStyle: "italic"
      };
    }
  } else if (context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP) {
    status = {
      color: "".concat(context.theme.subtitleColor)
    };

    if (state.typing) {
      status = {
        color: "".concat(context.theme.subtitleColor),
        fontStyle: "italic"
      };
    }
  }

  return _objectSpread({
    fontSize: "13px",
    width: "100%"
  }, status);
};

exports.chatStatusStyle = chatStatusStyle;

var chatOptionWrapStyle = function chatOptionWrapStyle() {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "auto"
  };
};

exports.chatOptionWrapStyle = chatOptionWrapStyle;