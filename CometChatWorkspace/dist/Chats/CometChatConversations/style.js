"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startConversationBtnStyle = exports.containerStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ = require("../../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var containerStyle = function containerStyle(props) {
  return {
    width: props.width,
    height: props.height,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    border: props.border
  };
};

exports.containerStyle = containerStyle;

var startConversationBtnStyle = function startConversationBtnStyle(props) {
  var direction = _.CometChatLocalize.isRTL() ? {
    left: "16px"
  } : {
    right: "16px"
  };
  return _objectSpread({
    mask: "url(".concat(props.startConversationIcon, ") no-repeat left center"),
    backgroundColor: "".concat(props.startConversationIconTint),
    height: "24px",
    width: "24px",
    cursor: "pointer",
    position: "absolute",
    top: "20px"
  }, direction);
};

exports.startConversationBtnStyle = startConversationBtnStyle;