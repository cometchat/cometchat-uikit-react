"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listBaseTitleStyle = exports.listBaseStyle = exports.listBaseSearchStyle = exports.listBaseSearchInputStyle = exports.listBaseSearchButtonStyle = exports.listBaseNavStyle = exports.listBaseHeadStyle = exports.listBaseContainerStyle = exports.backButtonStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _Shared = require("../../../Shared");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var listBaseStyle = function listBaseStyle(props) {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "16px 0",
    width: props.width,
    height: props.height,
    background: props.background,
    borderRadius: props.cornerRadius,
    border: props.border
  };
};

exports.listBaseStyle = listBaseStyle;

var listBaseHeadStyle = function listBaseHeadStyle(props) {
  var height = !props.hideSearch ? {
    height: "101px"
  } : {
    height: "40px"
  };
  return _objectSpread({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  }, height);
};

exports.listBaseHeadStyle = listBaseHeadStyle;

var listBaseNavStyle = function listBaseNavStyle(props) {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    width: "100%",
    marginBottom: "16px"
  };
};

exports.listBaseNavStyle = listBaseNavStyle;

var backButtonStyle = function backButtonStyle(props) {
  return {
    mask: "url(".concat(props.backIcon, ") no-repeat left center"),
    backgroundColor: "".concat(props.backIconTint),
    height: "24px",
    width: "24px",
    cursor: "pointer"
  };
};

exports.backButtonStyle = backButtonStyle;

var listBaseTitleStyle = function listBaseTitleStyle(props) {
  return {
    font: props.titleFont,
    color: props.titleColor,
    lineHeight: "26px",
    width: "100%"
  };
};

exports.listBaseTitleStyle = listBaseTitleStyle;

var listBaseSearchStyle = function listBaseSearchStyle(props) {
  return {
    borderRadius: props.searchCornerRadius,
    boxShadow: "".concat(props.searchBackground, " 0 0 0 1px inset"),
    backgroundColor: props.searchBackground,
    font: props.searchTextFont,
    color: props.searchTextColor,
    lineHeight: "20px",
    height: "35px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "24px"
  };
};

exports.listBaseSearchStyle = listBaseSearchStyle;

var listBaseSearchButtonStyle = function listBaseSearchButtonStyle(searchIcon, props) {
  return {
    width: "35px",
    height: "100%",
    padding: "8px 0 8px 8px",
    cursor: "default",
    mask: "url(".concat(searchIcon, ") center center no-repeat"),
    backgroundColor: "".concat(props.searchTextColor, "!important")
  };
};

exports.listBaseSearchButtonStyle = listBaseSearchButtonStyle;

var listBaseSearchInputStyle = function listBaseSearchInputStyle(props) {
  var padding = _Shared.CometChatLocalize.isRTL() ? {
    padding: "8px 0 8px 8px"
  } : {
    padding: "8px 8px 8px 0"
  };
  return _objectSpread({
    width: "calc(100% - 35px)",
    outline: "none",
    height: "100%",
    font: props.searchTextFont,
    color: props.searchTextColor,
    backgroundColor: "transparent",
    border: props.searchBorder
  }, padding);
};

exports.listBaseSearchInputStyle = listBaseSearchInputStyle;

var listBaseContainerStyle = function listBaseContainerStyle(props) {
  var height = !props.hideSearch ? {
    height: "calc(100% - 101px)"
  } : {
    height: "calc(100% - 50px)"
  };
  return _objectSpread({
    background: "inherit",
    width: "100%"
  }, height);
};

exports.listBaseContainerStyle = listBaseContainerStyle;