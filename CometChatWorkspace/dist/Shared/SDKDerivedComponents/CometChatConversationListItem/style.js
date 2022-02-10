"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typingTextStyle = exports.titleStyle = exports.subTitleStyle = exports.listItemStyle = exports.itemTitleStyle = exports.itemTimeStyle = exports.itemThumbnailStyle = exports.itemThreadIndicatorStyle = exports.itemSubTitleStyle = exports.itemDetailStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ = require("../../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var listItemStyle = function listItemStyle(props) {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "left",
    alignItems: "flex-start",
    cursor: "pointer",
    width: "100%",
    padding: "8px 0",
    position: "relative",
    background: props.background
  };
};

exports.listItemStyle = listItemStyle;

var itemThumbnailStyle = function itemThumbnailStyle() {
  return {
    display: "inline-block",
    width: "auto",
    height: "auto",
    flexShrink: "0",
    position: "relative"
  };
};

exports.itemThumbnailStyle = itemThumbnailStyle;

var itemDetailStyle = function itemDetailStyle(props) {
  var padding = _.CometChatLocalize.isRTL() ? {
    paddingRight: "16px"
  } : {
    paddingLeft: "16px"
  };
  return _objectSpread({
    width: "calc(100% - 55px)",
    flexGrow: "1",
    borderBottom: props.border,
    paddingBottom: "4px"
  }, padding);
};

exports.itemDetailStyle = itemDetailStyle;

var itemTitleStyle = function itemTitleStyle() {
  return {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start"
  };
};

exports.itemTitleStyle = itemTitleStyle;

var itemSubTitleStyle = function itemSubTitleStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };
};

exports.itemSubTitleStyle = itemSubTitleStyle;

var titleStyle = function titleStyle(props) {
  return {
    font: props.titleFont,
    color: props.titleColor,
    display: "block",
    width: "calc(100% - 70px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "22px"
  };
};

exports.titleStyle = titleStyle;

var subTitleStyle = function subTitleStyle(props) {
  return {
    font: props.subTitleFont,
    color: props.subTitleColor,
    width: "calc(100% - 24px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "24px",
    margin: "0"
  };
};

exports.subTitleStyle = subTitleStyle;

var itemTimeStyle = function itemTimeStyle(props) {
  return {
    font: props.timeFont,
    color: props.timeColor,
    width: "70px",
    textAlign: "right"
  };
};

exports.itemTimeStyle = itemTimeStyle;

var typingTextStyle = function typingTextStyle(props) {
  return {
    font: props.typingIndicatorTextFont,
    color: props.typingIndicatorTextColor,
    width: "calc(100% - 24px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "24px",
    margin: "0"
  };
};

exports.typingTextStyle = typingTextStyle;

var itemThreadIndicatorStyle = function itemThreadIndicatorStyle(props) {
  return {
    font: props.subTitleFont,
    color: props.subTitleColor,
    width: "100%",
    lineHeight: "20px"
  };
};

exports.itemThreadIndicatorStyle = itemThreadIndicatorStyle;