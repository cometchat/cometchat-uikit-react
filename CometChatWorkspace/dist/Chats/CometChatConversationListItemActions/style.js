"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteActionStyle = exports.actionWrapperStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var actionWrapperStyle = function actionWrapperStyle(props) {
  return _objectSpread({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    listStyleType: "none",
    padding: "8px",
    margin: "0",
    background: "transparent",
    borderRadius: "4px"
  }, props.style);
};

exports.actionWrapperStyle = actionWrapperStyle;

var deleteActionStyle = function deleteActionStyle(deleteIcon) {
  return {
    outline: "0",
    border: "0",
    height: "24px",
    width: "24px",
    borderRadius: "4px",
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "center",
    position: "relative",
    background: "url(".concat(deleteIcon, ") center center no-repeat")
  };
};

exports.deleteActionStyle = deleteActionStyle;