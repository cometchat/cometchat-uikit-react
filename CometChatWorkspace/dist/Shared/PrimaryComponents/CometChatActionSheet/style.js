"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.actionSheetWrapperStyle = exports.actionSheetTitleStyle = exports.actionSheetLayoutIconStyle = exports.actionSheetHeaderStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _layoutType = require("./layoutType");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var actionSheetWrapperStyle = function actionSheetWrapperStyle(props) {
  var flexDirection = {
    flexDirection: "row"
  },
      justifyContent = {
    justifyContent: "center"
  },
      alignItems = {
    alignItems: "center"
  },
      flexWrap = {
    flexWrap: "wrap"
  };

  if (props.layoutType === _layoutType.layoutType["list"]) {
    flexDirection = {
      flexDirection: "column"
    };
    justifyContent = {
      justifyContent: "center"
    };
    alignItems = {
      alignItems: "center"
    };
    flexWrap = {
      flexWrap: "nowrap"
    };
  }

  return _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({
    background: props.background,
    borderRadius: props.cornerRadius,
    border: props.border,
    width: props.width,
    maxHeight: props.height,
    transform: "scale(1)",
    transformOrigin: "left bottom",
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    padding: "16px"
  }, flexDirection), flexWrap), justifyContent), alignItems), props.style);
};

exports.actionSheetWrapperStyle = actionSheetWrapperStyle;

var actionSheetHeaderStyle = function actionSheetHeaderStyle(props) {
  return {
    display: "flex",
    flexDirection: "row",
    width: "100%"
  };
};

exports.actionSheetHeaderStyle = actionSheetHeaderStyle;

var actionSheetTitleStyle = function actionSheetTitleStyle(props) {
  return {
    font: props.titleFont,
    color: props.titleColor,
    lineHeight: "22px",
    width: "calc(100% - 24px)"
  };
};

exports.actionSheetTitleStyle = actionSheetTitleStyle;

var actionSheetLayoutIconStyle = function actionSheetLayoutIconStyle(props) {
  return {
    mask: "url(".concat(props.layoutModeIconURL, ") no-repeat center center"),
    backgroundColor: "".concat(props.layoutModeIconTint),
    height: "24px",
    width: "24px"
  };
};

exports.actionSheetLayoutIconStyle = actionSheetLayoutIconStyle;