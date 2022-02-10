"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dialogWrapperStyle = exports.dialogMessageStyle = exports.dialogLoadingWrapperStyle = exports.dialogLoadingStyle = exports.dialogFormStyle = exports.dialogErrorStyle = exports.dialogButtonStyle = exports.dialogBackdropStyle = exports.buttonConfirmStyle = exports.buttonCancelStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var dialogBackdropStyle = function dialogBackdropStyle(props) {
  var display = props.isOpen ? {
    display: "block"
  } : {
    display: "none"
  };
  return _objectSpread({
    zIndex: "3",
    backgroundColor: "#000",
    opacity: ".3",
    width: "100%",
    height: "100%",
    top: "0",
    left: "0",
    cursor: "pointer",
    transition: "background .3s ease-out 0",
    position: "fixed"
  }, display);
};

exports.dialogBackdropStyle = dialogBackdropStyle;

var dialogLoadingWrapperStyle = function dialogLoadingWrapperStyle(props, state) {
  var display = state === "loading" ? {
    display: "flex"
  } : {
    display: "none"
  };
  return _objectSpread({
    justifyContent: "center",
    alignItems: "center",
    height: "50px",
    width: "100%"
  }, display);
};

exports.dialogLoadingWrapperStyle = dialogLoadingWrapperStyle;

var dialogLoadingStyle = function dialogLoadingStyle(props, state, img) {
  return {
    background: "url(".concat(img, ") center center"),
    width: "24px",
    height: "24px"
  };
};

exports.dialogLoadingStyle = dialogLoadingStyle;

var dialogWrapperStyle = function dialogWrapperStyle(props) {
  var display = props.isOpen ? {
    display: "block"
  } : {
    display: "none"
  };
  return _objectSpread({
    width: props.width,
    height: "auto",
    backgroundColor: props.background,
    position: "absolute",
    margin: "0 auto",
    padding: "16px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid #eee",
    zIndex: "4",
    top: "50%",
    left: "0",
    right: "0",
    transform: "translateY(-50%)"
  }, display);
};

exports.dialogWrapperStyle = dialogWrapperStyle;

var dialogFormStyle = function dialogFormStyle(props, state) {
  var display = state === "initial" || state === "done" ? {
    display: "block"
  } : {
    display: "none"
  };
  return _objectSpread({
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }, display);
};

exports.dialogFormStyle = dialogFormStyle;

var dialogErrorStyle = function dialogErrorStyle(props, state) {
  var display = state === "error" ? {
    display: "block"
  } : {
    display: "none"
  };
  return _objectSpread({
    font: "11px Inter",
    color: "red",
    textAlign: "center"
  }, display);
};

exports.dialogErrorStyle = dialogErrorStyle;

var dialogMessageStyle = function dialogMessageStyle() {
  return {
    textAlign: "center"
  };
};

exports.dialogMessageStyle = dialogMessageStyle;

var dialogButtonStyle = function dialogButtonStyle(props) {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: "24px 0 0 0"
  };
};

exports.dialogButtonStyle = dialogButtonStyle;

var buttonConfirmStyle = function buttonConfirmStyle(props) {
  return {
    padding: "5px 24px",
    margin: "0 8px",
    borderRadius: "4px",
    font: "600 12px Inter,sans-serif",
    border: "1px solid #39f",
    backgroundColor: "#39f!important",
    color: "#808080"
  };
};

exports.buttonConfirmStyle = buttonConfirmStyle;

var buttonCancelStyle = function buttonCancelStyle(props) {
  return {
    padding: "5px 24px",
    margin: "0 8px",
    borderRadius: "4px",
    font: "600 12px Inter,sans-serif",
    border: "1px solid #39f",
    backgroundColor: "#808080!important",
    color: "#808080"
  };
};

exports.buttonCancelStyle = buttonCancelStyle;